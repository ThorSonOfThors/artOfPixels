import { supabase } from '../lib/supabase'

type PixelGrid = string[][]

export async function savePicture(grid: PixelGrid) {
  if (!grid || !grid.length) {
    throw new Error('Grid is empty')
  }

  const size = grid.length

  // Optional validation (ensures square grid)
  for (const row of grid) {
    if (row.length !== size) {
      throw new Error('Grid must be square')
    }
  }

  // Get current user
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Insert into Supabase
  const { data, error } = await supabase
    .from('pictures')
    .insert([
      {
        user_id: user.id,
        pixels: grid,
        size: size
      }
    ])
    .select()
    .single()

  if (error) {
    console.error('Save error:', error)
    throw error
  }

  return data
}

export async function getPictures(page: number, limit: number = 10) {
  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('pictures')
    .select(`
      *,
      likes(count)
    `, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  // normalize count
  const normalized = data.map((p: any) => ({
    ...p,
    likes_count: p.likes?.[0]?.count || 0
  }))

  return {
    pictures: normalized,
    total: count || 0
  }
}


export async function getMyPictures(page: number, limit: number = 10) {
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const from = (page - 1) * limit
  const to = from + limit - 1

  const { data, error, count } = await supabase
    .from('pictures')
    .select(`
      *,
      likes(count)
    `, { count: 'exact' })
    .eq('user_id', user.id) // 🔥 key difference
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  const normalized = data.map((p: any) => ({
    ...p,
    likes_count: p.likes?.[0]?.count || 0
  }))

  return {
    pictures: normalized,
    total: count || 0
  }
}

export async function getPictureById(id: string) {
  const { data, error } = await supabase
    .from('pictures')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Fetch one error:', error)
    throw error
  }

  return data
}


export async function updatePicture(id: string, grid: string[][]) {
  if (!grid || !grid.length) {
    throw new Error('Grid is empty')
  }

  const size = grid.length

  // optional validation (square)
  for (const row of grid) {
    if (row.length !== size) {
      throw new Error('Grid must be square')
    }
  }

  const { data, error } = await supabase
    .from('pictures')
    .update({
      pixels: grid,
      size: size
      // updated_at will auto-update via trigger
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Update error:', error)
    throw error
  }

  return data
}

export async function toggleLike(pictureId: string) {
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  // check if already liked
  const { data: existing } = await supabase
    .from('likes')
    .select('*')
    .eq('user_id', user.id)
    .eq('picture_id', pictureId)
    .maybeSingle()

  if (existing) {
    // 🔥 unlike
    await supabase
      .from('likes')
      .delete()
      .eq('user_id', user.id)
      .eq('picture_id', pictureId)

    return false
  } else {
    // 🔥 like
    await supabase
      .from('likes')
      .insert({
        user_id: user.id,
        picture_id: pictureId
      })

    return true
  }
}


export async function getLikeCount(pictureId: string) {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('picture_id', pictureId)

  if (error) throw error
  return count || 0
}


export async function getComments(pictureId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      id,
      content,
      created_at,
      user_id,
      profiles (
        username
      )
    `)
    .eq('picture_id', pictureId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return data.map(c => ({
    id: c.id,
    content: c.content,
    created_at: c.created_at,
    user_id: c.user_id,
    username: (c.profiles as any)?.username || 'unknown'
  }))
}


export async function addComment(pictureId: string, content: string) {
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('comments')
    .insert([
      {
        picture_id: pictureId,
        user_id: user.id,
        content
      }
    ])
    .select()
    .single()

  if (error) throw error
  return data
}


export async function deletePicture(id: string) {
  const { error } = await supabase
    .from('pictures')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}