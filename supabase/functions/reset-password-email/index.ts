import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { email } = await req.json()

        if (!email) {
            throw new Error('Email is required')
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const resendApiKey = Deno.env.get('RESEND_API_KEY') ?? ''

        if (!resendApiKey) {
            throw new Error('RESEND_API_KEY is not set')
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Generate a random password
        const newPassword = Math.random().toString(36).slice(-10) + "!" + Math.floor(Math.random() * 100);

        // 2. Find the user by email
        const { data: { users }, error: listUserError } = await supabaseAdmin.auth.admin.listUsers()
        if (listUserError) throw listUserError

        const user = users.find(u => u.email === email)
        if (!user) {
            return new Response(JSON.stringify({ message: "If an account exists for this email, a new password has been sent." }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            })
        }

        // 3. Update the user password
        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        )
        if (updateError) throw updateError

        // 4. Send email via Resend API
        const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
            },
            body: JSON.stringify({
                from: 'onboarding@resend.dev',
                to: email,
                subject: 'Your New Password - DEC Tracker',
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #334155;">
            <h2 style="color: #2563eb;">Password Reset</h2>
            <p>Hello,</p>
            <p>Your password for DEC Tracker has been reset. You can now log in using the following temporary password:</p>
            <div style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <code style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${newPassword}</code>
            </div>
            <p><strong>Please change your password immediately after logging in.</strong></p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #94a3b8;">If you did not request this reset, please contact your administrator.</p>
          </div>
        `,
            }),
        })

        if (!res.ok) {
            const errorData = await res.json()
            throw new Error(`Resend API error: ${JSON.stringify(errorData)}`)
        }

        return new Response(JSON.stringify({
            message: "A new password has been sent to your email.",
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
