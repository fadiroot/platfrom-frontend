-- Create user_roles table and assign admin role

-- Create user_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  assigned_at TIMESTAMP DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create policy for user_roles (users can see their own roles, admins can see all)
CREATE POLICY "Users can view own roles" ON public.user_roles
FOR SELECT USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
    AND ur.is_active = true
  )
);

-- Create policy for admins to manage roles
CREATE POLICY "Admins can manage roles" ON public.user_roles
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'admin'
    AND ur.is_active = true
  )
);

-- Insert admin role for the first user (fadi.romdhan@horizon-tech.tn)
INSERT INTO public.user_roles (user_id, role, is_active, assigned_at)
VALUES ('1d106cd0-c73d-463a-9fea-c9a19676112e', 'admin', true, NOW())
ON CONFLICT (user_id, role) DO UPDATE SET
  is_active = true,
  assigned_at = NOW();

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;