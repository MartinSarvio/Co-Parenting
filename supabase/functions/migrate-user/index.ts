import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ error: 'Email er påkrævet' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Service role client — kan oprette auth-brugere og bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Tjek om brugeren allerede findes i auth.users
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === normalizedEmail,
    );

    if (existingAuthUser) {
      // Brugeren findes allerede i auth — send bare recovery email
      await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: normalizedEmail,
      });

      return new Response(JSON.stringify({
        success: true,
        message: 'Recovery email sendt',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Brugeren findes IKKE i auth — slå op i profiles
    const { data: profile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, name')
      .eq('email', normalizedEmail)
      .single();

    if (profileErr || !profile) {
      // Ingen profil fundet — returner generisk besked (sikkerhed: afslør ikke om email findes)
      return new Response(JSON.stringify({
        success: true,
        message: 'Hvis emailen findes, sender vi et link',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Opret auth-bruger med SAMME ID som profilen
    const { error: createErr } = await supabaseAdmin.auth.admin.createUser({
      id: profile.id,
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: { name: profile.name },
    });

    if (createErr) {
      console.error('Fejl ved oprettelse af auth-bruger:', createErr);
      return new Response(JSON.stringify({ error: 'Kunne ikke oprette bruger' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send recovery email så brugeren kan sætte et password
    await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Bruger migreret — recovery email sendt',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('migrate-user error:', err);
    return new Response(JSON.stringify({ error: 'Intern fejl' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
