import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { email, username } = await request.json();

    if (!email || !username) {
      return NextResponse.json(
        { error: 'Email and username are required' },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: adminProfile, error: adminCheckError } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .maybeSingle();

    if (adminCheckError || !adminProfile || !adminProfile.is_admin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    const { data: existingUser, error: userSearchError } = await supabase
      .from('profiles')
      .select('id, username, is_admin')
      .eq('username', username)
      .maybeSingle();

    if (userSearchError && userSearchError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'Failed to search for user' },
        { status: 500 }
      );
    }

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found. The user must sign up first before being granted admin privileges.' },
        { status: 404 }
      );
    }

    if (existingUser.is_admin) {
      return NextResponse.json(
        { error: 'User is already an admin' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: true })
      .eq('id', existingUser.id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to grant admin privileges' },
        { status: 500 }
      );
    }

    const { error: logError } = await supabase
      .from('admin_actions_log')
      .insert({
        performed_by: user.id,
        target_user_id: existingUser.id,
        action_type: 'grant_admin',
      });

    if (logError) {
      console.error('Log error:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully granted admin privileges to ${username}`,
      user: {
        id: existingUser.id,
        username: existingUser.username,
      },
    });

  } catch (error) {
    console.error('Add admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
