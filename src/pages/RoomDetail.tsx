import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import NavBar from '../components/NavBar'

type Room = { id: string, name: string, penalty_late: number, penalty_missed: number, penalty_qadha: number, target_days: number }
type Member = { user_id: string, email: string, total_owed: number, today_photo: string | null, status: string }

export default function RoomDetail() {
  const { roomId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [isPaying, setIsPaying] = useState(false)
  const [copied, setCopied] = useState(false)

  // Extract fetching logic so we can reuse it after marking as paid
  const fetchRoomData = async () => {
    if (!user || !roomId) return

    // 1. Fetch Room details
    const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).single()
    if (roomData) setRoom(roomData)

    // 2. Fetch Members
    const { data: memberData } = await supabase.from('room_members').select('user_id').eq('room_id', roomId)

    if (memberData) {
      // 3. Fetch Penalties
      const { data: penaltyData } = await supabase.from('room_penalties').select('user_id, amount, paid').eq('room_id', roomId)

      // 4. Fetch Today's Prayer Records (for Proofs)
      const todayStr = new Date().toLocaleDateString('en-CA')
      const memberIds = memberData.map(m => m.user_id)
      
      const { data: recordsData } = await supabase
        .from('prayer_records')
        .select('user_id, photo_path, status, prayer_name')
        .in('user_id', memberIds)
        .eq('prayer_date', todayStr)

      // Process members and generate Signed URLs for photos
      const mappedMembers = await Promise.all(memberData.map(async (m) => {
        const memberPenalties = penaltyData?.filter(p => p.user_id === m.user_id && !p.paid) || []
        const totalOwed = memberPenalties.reduce((sum, p) => sum + p.amount, 0)
        
        const todayRecord = recordsData?.find(r => r.user_id === m.user_id && r.photo_path)
        let signedUrl = null
        
        if (todayRecord && todayRecord.photo_path) {
          const { data } = await supabase.storage
            .from('prayer_photos')
            .createSignedUrl(todayRecord.photo_path, 3600, {
              transform: { width: 300, height: 300, resize: 'cover' } // Added compression here to save egress!
            })
          if (data) signedUrl = data.signedUrl
        }

        return {
          user_id: m.user_id,
          email: m.user_id === user.id ? 'You' : `Member ${m.user_id.slice(0, 4)}`,
          total_owed: totalOwed,
          today_photo: signedUrl,
          status: todayRecord ? todayRecord.status : 'Not logged'
        }
      }))

      setMembers(mappedMembers)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchRoomData()
  }, [roomId, user])

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/rooms/join/${roomId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeaveRoom = async () => {
    if (!user || !roomId) return
    if (!window.confirm("Are you sure you want to leave this room?")) return

    await supabase.from('room_members').delete().eq('room_id', roomId).eq('user_id', user.id)
    navigate('/rooms')
  }

  const handleMarkAsPaid = async () => {
    if (!user || !roomId) return
    
    const myData = members.find(m => m.user_id === user.id)
    if (!myData || myData.total_owed === 0) return

    const confirmPay = window.confirm(`Have you paid ₹${myData.total_owed} to charity? Clicking OK will clear your pot.`)
    if (!confirmPay) return

    setIsPaying(true)

    // Update all unpaid penalties for this user in this room
    const { error } = await supabase
      .from('room_penalties')
      .update({ paid: true })
      .eq('room_id', roomId)
      .eq('user_id', user.id)
      .eq('paid', false)

    if (error) {
      alert(`Error updating: ${error.message}`)
    } else {
      // Re-fetch data to update the UI automatically
      await fetchRoomData()
    }
    
    setIsPaying(false)
  }

  if (loading) return <div className="p-8 font-mono text-sm">LOADING ROOM...</div>
  if (!room) return <div className="p-8 font-mono text-sm">ROOM NOT FOUND.</div>

  // Calculate my specific total to show on the button
  const myData = members.find(m => m.user_id === user?.id)
  const myTotalOwed = myData?.total_owed || 0

  return (
    <div className="mx-auto max-w-[1120px] px-6 pt-8 pb-24">
      <NavBar />
      
      <div className="mb-8">
        <Link to="/rooms" className="kicker text-[var(--ink-2)] hover:text-[var(--ink)] mb-4 inline-block">&larr; BACK TO ROOMS</Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-[var(--line)] pb-4 gap-4">
          <div>
            <p className="kicker mb-1">{room.target_days} DAY CHALLENGE</p>
            <h1 className="font-display m-0 text-4xl font-normal">{room.name}</h1>
          </div>
          
          <div className="flex gap-2">
            <button onClick={handleLeaveRoom} className="border border-[var(--st-missed)] text-[var(--st-missed)] px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-[var(--st-missed)]/10 transition-colors rounded-lg">
              LEAVE ROOM
            </button>
            <button onClick={copyInviteLink} className="border border-[var(--line-strong)] text-[var(--ink)] px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-[var(--surface)] transition-colors rounded-lg">
              {copied ? 'COPIED!' : 'INVITE FRIEND'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        
        {/* Members List with Proofs */}
        <div>
          <h2 className="font-display text-2xl mb-4">Members & Today's Proof</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {members.map(member => (
              <div key={member.user_id} className="flex flex-col border border-[var(--line)] bg-[var(--surface)] p-4 rounded-xl shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className="font-display text-lg block">{member.email}</span>
                    <span className="kicker text-[10px] text-[var(--ink-2)]">{member.status.toUpperCase()}</span>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono text-sm ${member.total_owed > 0 ? 'text-[var(--st-missed)]' : 'text-[var(--st-on-time)]'}`}>
                      ₹{member.total_owed}
                    </p>
                    <p className="kicker text-[10px] text-[var(--ink-2)]">SADAQAH</p>
                  </div>
                </div>
                
                {/* Photo Proof Area */}
                {member.today_photo ? (
                  <div className="mt-auto">
                    <img 
                      src={member.today_photo} 
                      alt="Prayer Proof" 
                      className="w-full h-32 object-cover rounded-lg border border-[var(--line)]"
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-[var(--paper)] rounded-lg border border-dashed border-[var(--line-strong)] flex items-center justify-center mt-auto">
                    <span className="kicker text-[10px] text-[var(--ink-2)]">NO PHOTO PROOF</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Charity Pot Ledger */}
        <aside className="bg-[var(--surface)] border border-[var(--line)] rounded-xl p-6 h-fit shadow-sm">
          <h2 className="font-display text-2xl mb-1">Sadaqah Pot</h2>
          <p className="text-xs text-[var(--ink-2)] mb-6">
            Track your penalties. Once you pay a charity offline, mark it here.
          </p>
          
          <div className="flex flex-col gap-4">
            <div className="flex justify-between border-b border-[var(--line)] pb-2">
              <span className="text-sm">Late</span>
              <span className="font-mono text-sm text-[var(--st-late)]">₹{room.penalty_late}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--line)] pb-2">
              <span className="text-sm">Missed</span>
              <span className="font-mono text-sm text-[var(--st-missed)]">₹{room.penalty_missed}</span>
            </div>
            <div className="flex justify-between border-b border-[var(--line)] pb-2">
              <span className="text-sm">Qadha</span>
              <span className="font-mono text-sm text-[var(--st-qadha)]">₹{room.penalty_qadha}</span>
            </div>
          </div>
          
          <button 
            onClick={handleMarkAsPaid}
            disabled={isPaying || myTotalOwed === 0}
            className="w-full border border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] py-3 mt-8 rounded-lg font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPaying ? 'UPDATING...' : myTotalOwed === 0 ? 'NO DUES PENDING' : 'MARK MY POT AS PAID'}
          </button>
        </aside>
      </div>
    </div>
  )
}