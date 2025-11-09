import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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

    if (user.id === userId) {
      return NextResponse.json(
        { error: 'You cannot revoke your own admin privileges' },
        { status: 400 }
      );
    }

    const { data: targetUser, error: userSearchError } = await supabase
      .from('profiles')
      .select('id, username, is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (userSearchError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!targetUser.is_admin) {
      return NextResponse.json(
        { error: 'User is not an admin' },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_admin: false })
      .eq('id', userId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to revoke admin privileges' },
        { status: 500 }
      );
    }

    const { error: logError } = await supabase
      .from('admin_actions_log')
      .insert({
        performed_by: user.id,
        target_user_id: userId,
        action_type: 'revoke_admin',
      });

    if (logError) {
      console.error('Log error:', logError);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully revoked admin privileges from ${targetUser.username}`,
    });

  } catch (error) {
    console.error('Revoke admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
