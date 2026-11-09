import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import NavBar from '../components/NavBar'

type Room = { id: string, name: string, penalty_late: number, penalty_missed: number, penalty_qadha: number, target_days: number }
type Member = { user_id: string, email: string, total_owed: number }

export default function RoomDetail() {
  const { roomId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const [room, setRoom] = useState<Room | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function fetchRoomData() {
      if (!user || !roomId) return

      // 1. Fetch Room details
      const { data: roomData } = await supabase.from('rooms').select('*').eq('id', roomId).single()
      if (roomData) setRoom(roomData)

      // 2. Fetch Members
      const { data: memberData } = await supabase
        .from('room_members')
        .select('user_id')
        .eq('room_id', roomId)

      if (memberData) {
        const { data: penaltyData } = await supabase
          .from('room_penalties')
          .select('user_id, amount, paid')
          .eq('room_id', roomId)

        const mappedMembers = memberData.map(m => {
          const memberPenalties = penaltyData?.filter(p => p.user_id === m.user_id && !p.paid) || []
          const totalOwed = memberPenalties.reduce((sum, p) => sum + p.amount, 0)
          
          return {
            user_id: m.user_id,
            email: m.user_id === user.id ? 'You' : `Member ${m.user_id.slice(0, 4)}`,
            total_owed: totalOwed
          }
        })
        setMembers(mappedMembers)
      }
      setLoading(false)
    }
    fetchRoomData()
  }, [roomId, user])

  const copyInviteLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/rooms/join/${roomId}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeaveRoom = async () => {
    if (!user || !roomId) return
    
    // Confirmation prompt
    const confirmLeave = window.confirm("Are you sure you want to leave this room? Your past records will remain, but you will no longer be part of this challenge.")
    if (!confirmLeave) return

    // Delete the user's membership
    const { error } = await supabase
      .from('room_members')
      .delete()
      .eq('room_id', roomId)
      .eq('user_id', user.id)

    if (error) {
      alert(`Error leaving room: ${error.message}`)
    } else {
      navigate('/rooms')
    }
  }

  if (loading) return <div className="p-8 font-mono text-sm">LOADING ROOM...</div>
  if (!room) return <div className="p-8 font-mono text-sm">ROOM NOT FOUND.</div>

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
            <button 
              onClick={handleLeaveRoom} 
              className="border border-[var(--st-missed)] text-[var(--st-missed)] px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-[var(--st-missed)]/10 transition-colors"
            >
              LEAVE ROOM
            </button>
            <button 
              onClick={copyInviteLink} 
              className="border border-[var(--line-strong)] text-[var(--ink)] px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-[var(--surface)] transition-colors"
            >
              {copied ? 'COPIED!' : 'INVITE FRIEND'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
        
        {/* Members List */}
        <div>
          <h2 className="font-display text-2xl mb-4">Members</h2>
          <div className="flex flex-col gap-3">
            {members.map(member => (
              <div key={member.user_id} className="flex justify-between items-center border border-[var(--line)] bg-[var(--surface)] p-4">
                <span className="font-display text-lg">{member.email}</span>
                <div className="text-right">
                  <p className="font-mono text-sm text-[var(--st-missed)]">₹{member.total_owed}</p>
                  <p className="kicker text-[10px] text-[var(--ink-2)]">UNPAID SADAQAH</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charity Pot Ledger */}
        <aside className="bg-[var(--surface)] border border-[var(--line)] p-6 h-fit">
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
          
          <button className="w-full border border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-ink)] py-3 mt-8 font-mono text-xs uppercase tracking-widest hover:opacity-90 transition-all">
            MARK MY POT AS PAID
          </button>
        </aside>
      </div>
    </div>
  )
}