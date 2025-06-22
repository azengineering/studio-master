
import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

// First, let's create the saved_searches table if it doesn't exist
function ensureSavedSearchesTable() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS saved_searches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        filters TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches (user_id)`);
  } catch (error) {
    console.error('Error creating saved_searches table:', error);
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureSavedSearchesTable();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const savedSearches = db.prepare(`
      SELECT id, name, filters, created_at as createdAt
      FROM saved_searches
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(userId);

    const formattedSearches = savedSearches.map((search: any) => ({
      ...search,
      filters: JSON.parse(search.filters)
    }));

    return NextResponse.json({ savedSearches: formattedSearches });
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    return NextResponse.json({ error: 'Failed to fetch saved searches' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureSavedSearchesTable();
    
    const { userId, name, filters } = await request.json();

    if (!userId || !name || !filters) {
      return NextResponse.json({ error: 'User ID, name, and filters are required' }, { status: 400 });
    }

    const result = db.prepare(`
      INSERT INTO saved_searches (user_id, name, filters)
      VALUES (?, ?, ?)
    `).run(userId, name, JSON.stringify(filters));

    return NextResponse.json({ 
      success: true, 
      savedSearch: { 
        id: result.lastInsertRowid, 
        name, 
        filters, 
        createdAt: new Date().toISOString() 
      } 
    });
  } catch (error) {
    console.error('Error saving search:', error);
    return NextResponse.json({ error: 'Failed to save search' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const searchId = searchParams.get('id');
    const userId = searchParams.get('userId');

    if (!searchId || !userId) {
      return NextResponse.json({ error: 'Search ID and User ID are required' }, { status: 400 });
    }

    db.prepare(`
      DELETE FROM saved_searches
      WHERE id = ? AND user_id = ?
    `).run(searchId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return NextResponse.json({ error: 'Failed to delete saved search' }, { status: 500 });
  }
}
