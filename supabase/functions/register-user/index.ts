import express from 'express';
import { createClient } from '@supabase/supabase-js';
import bodyParser from 'body-parser';

const app = express();
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  next();
});

app.options('*', (req, res) => {
  res.send('ok');
});

app.post('/register-user', async (req, res) => {
  try {
    const { email, password, fullName, studentId, department, faculty, phone } = req.body;

    // Validate required fields
    if (!email || !password || !fullName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and full name are required'
      });
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Step 1: Create the auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        student_id: studentId,
        department,
        faculty,
        phone,
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return res.status(400).json({
        success: false,
        error: authError.message || 'Failed to create user account'
      });
    }

    if (!authData.user) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create user account'
      });
    }

    // Step 2: Wait a moment for auth to propagate
    await new Promise(resolve => setTimeout(resolve, 500))

    // Step 3: Create the profile using upsert to avoid conflicts
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email: email,
        full_name: fullName,
        student_id: studentId || null,
        department: department || null,
        faculty: faculty || null,
        phone: phone || null,
        role: 'buyer',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      // If profile creation fails, delete the auth user to keep things clean
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return res.status(400).json({
        success: false,
        error: `Database error: ${profileError.message}`
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Account created successfully',
      userId: authData.user.id
    });

  } catch (error) {
    console.error('Registration error:', error)
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});