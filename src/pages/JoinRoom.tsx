import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function JoinRoom() {
  const { roomId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('Joining room...')

  useEffect(() => {
    async function join() {
      if (!user || !roomId) return

      // Check if already a member
      const { data: existing } = await supabase
        .from('room_members')
        .select('id')
        .eq('room_id', roomId)
        .eq('user_id', user.id)
        .single()

      if (existing) {
        navigate(`/rooms/${roomId}`)
        return
      }

      // Join the room
      const { error } = await supabase
        .from('room_members')
        .insert({ room_id: roomId, user_id: user.id })

      if (error) {
        setStatus(`Error: ${error.message}`)
      } else {
        navigate(`/rooms/${roomId}`)
      }
    }
    join()
  }, [user, roomId, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
      <p className="font-mono text-sm">{status}</p>
    </div>
  )
}