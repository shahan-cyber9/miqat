export async function getPrayerTimes(
  lat: number, 
  lng: number, 
  date: Date, 
  method: number = 1, 
  school: number = 0
) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const dateString = `${day}-${month}-${year}`

  try {
    const res = await fetch(
      `https://api.aladhan.com/v1/timings/${dateString}?latitude=${lat}&longitude=${lng}&method=${method}&school=${school}`
    )
    
    if (!res.ok) throw new Error('Failed to fetch prayer times')
    
    const json = await res.json()
    const rawTimings = json.data.timings
    
    return {
      fajr: rawTimings.Fajr.split(' ')[0],
      dhuhr: rawTimings.Dhuhr.split(' ')[0],
      asr: rawTimings.Asr.split(' ')[0],
      maghrib: rawTimings.Maghrib.split(' ')[0],
      isha: rawTimings.Isha.split(' ')[0],
    }
  } catch (error) {
    console.error('Error fetching prayer times:', error)
    return null
  }
}