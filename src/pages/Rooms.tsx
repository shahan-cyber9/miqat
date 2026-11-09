import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'

type Room = {
  id: string
  name: string
  created_by: string
  penalty_late: number
  penalty_missed: number
  penalty_qadha: number
  target_days: number
}

export default function Rooms() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [rooms, setRooms] = useState<Room[]>([])
  
  const [isCreating, setIsCreating] = useState(false)
  const [roomName, setRoomName] = useState('')
  const [penLate, setPenLate] = useState(5)
  const [penMissed, setPenMissed] = useState(10)
  const [penQadha, setPenQadha] = useState(20)
  const [targetDays, setTargetDays] = useState(30)

  useEffect(() => {
    async function fetchRooms() {
      if (!user) return

      const { data, error } = await supabase
        .from('room_members')
        .select(`
          room_id,
          rooms (
            id, name, created_by, penalty_late, penalty_missed, penalty_qadha, target_days
          )
        `)
        .eq('user_id', user.id)

      if (!error && data) {
        const fetchedRooms = data.map((d: any) => d.rooms)
        setRooms(fetchedRooms)
      }
      setLoading(false)
    }

    fetchRooms()
  }, [user])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !roomName) return

    const { data: newRoom, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name: roomName,
        created_by: user.id,
        penalty_late: penLate,
        penalty_missed: penMissed,
        penalty_qadha: penQadha,
        target_days: targetDays
      })
      .select()
      .single()

    if (roomError) {
      alert(roomError.message)
      return
    }

    const { error: memberError } = await supabase
      .from('room_members')
      .insert({ room_id: newRoom.id, user_id: user.id })

    if (memberError) {
      alert(memberError.message)
      return
    }

    setRooms([...rooms, newRoom])
    setIsCreating(false)
    setRoomName('')
  }

  return (
    <div className="mx-auto max-w-[1120px] px-4 sm:px-6 pt-0 pb-24 min-h-screen">
      <NavBar />

      <main className="mt-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 mb-8 border-b border-[var(--line)] pb-4">
          <div>
            <p className="kicker mb-2">ACCOUNTABILITY</p>
            <h1 className="font-display m-0 text-3xl sm:text-4xl font-normal">Rooms</h1>
            <p className="font-display text-sm italic text-[var(--ink-2)] mt-2">
              "Cooperate with one another in goodness and righteousness." (Quran 5:2)
            </p>
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="border border-[var(--accent)] bg-[var(--accent)] rounded-lg px-6 py-2.5 font-mono uppercase tracking-widest text-xs text-[var(--accent-ink)] hover:opacity-90 transition-all shadow-sm"
          >
            CREATE ROOM
          </button>
        </div>

        {loading ? (
          <p className="font-mono text-sm text-[var(--ink-2)]">LOADING ROOMS...</p>
        ) : rooms.length === 0 ? (
          <div className="text-center py-20 border border-[var(--line)] bg-[var(--surface)] rounded-xl shadow-sm">
            <p className="font-display text-2xl mb-2 text-[var(--ink)]">No rooms yet.</p>
            <p className="text-sm text-[var(--ink-2)]">Create a room to invite friends and track your Sadaqah pot.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rooms.map(room => (
              <div key={room.id} className="border border-[var(--line)] bg-[var(--surface)] rounded-xl p-6 shadow-sm">
                <h3 className="font-display text-2xl mb-1">{room.name}</h3>
                <p className="kicker text-[var(--ink-2)] mb-4">{room.target_days} DAY CHALLENGE</p>
                
                <div className="grid grid-cols-3 gap-2 text-center mb-6">
                  <div className="border border-[var(--line)] rounded-lg p-2 bg-[var(--paper)]">
                    <p className="font-mono text-xs text-[var(--st-late)]">₹{room.penalty_late}</p>
                    <p className="kicker text-[10px] mt-1">LATE</p>
                  </div>
                  <div className="border border-[var(--line)] rounded-lg p-2 bg-[var(--paper)]">
                    <p className="font-mono text-xs text-[var(--st-missed)]">₹{room.penalty_missed}</p>
                    <p className="kicker text-[10px] mt-1">MISSED</p>
                  </div>
                  <div className="border border-[var(--line)] rounded-lg p-2 bg-[var(--paper)]">
                    <p className="font-mono text-xs text-[var(--st-qadha)]">₹{room.penalty_qadha}</p>
                    <p className="kicker text-[10px] mt-1">QADHA</p>
                  </div>
                </div>

                <Link to={`/rooms/${room.id}`} className="block text-center w-full border border-[var(--line-strong)] rounded-lg py-2 font-mono text-xs uppercase tracking-widest hover:bg-[var(--paper)] transition-colors">
                  OPEN ROOM
                </Link>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-[var(--surface)] w-full max-w-md border border-[var(--line)] rounded-2xl shadow-2xl p-6 sm:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <p className="kicker text-[var(--ink-2)] mb-1">NEW CHALLENGE</p>
                <h2 className="font-display text-3xl font-normal">Create Room</h2>
              </div>
              <button onClick={() => setIsCreating(false)} className="kicker hover:text-[var(--ink)] text-[var(--ink-2)] bg-[var(--line)]/50 px-3 py-1 rounded-lg">CANCEL</button>
            </div>

            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div>
                <label className="kicker mb-1 block">Room Name</label>
                <input 
                  type="text" 
                  value={roomName} 
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., Fajr Warriors" 
                  className="w-full border border-[var(--line)] rounded-xl bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>

              <div>
                <label className="kicker mb-1 block">Target Duration (Days)</label>
                <input 
                  type="number" 
                  value={targetDays} 
                  onChange={(e) => setTargetDays(parseInt(e.target.value))}
                  className="w-full border border-[var(--line)] rounded-xl bg-[var(--paper)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  required
                />
              </div>

              <div className="border border-[var(--line)] rounded-xl p-4 bg-[var(--paper)] mt-2">
                <p className="kicker mb-3 text-[var(--ink)]">Sadaqah Penalties (₹)</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Late</span>
                    <input type="number" value={penLate} onChange={(e) => setPenLate(parseInt(e.target.value))} className="w-20 border border-[var(--line)] rounded-md px-2 py-1 text-sm bg-[var(--surface)]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Missed</span>
                    <input type="number" value={penMissed} onChange={(e) => setPenMissed(parseInt(e.target.value))} className="w-20 border border-[var(--line)] rounded-md px-2 py-1 text-sm bg-[var(--surface)]" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Qadha</span>
                    <input type="number" value={penQadha} onChange={(e) => setPenQadha(parseInt(e.target.value))} className="w-20 border border-[var(--line)] rounded-md px-2 py-1 text-sm bg-[var(--surface)]" />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full border border-[var(--accent)] bg-[var(--accent)] rounded-xl px-4 py-3 font-mono uppercase tracking-widest text-sm text-[var(--accent-ink)] hover:opacity-90 mt-2 shadow-md">
                CREATE ROOM
              </button>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </div>
  )
}