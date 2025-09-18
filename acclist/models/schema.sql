-- AccountaList Database Schema

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS TABLE
-- Extends Supabase Auth users with additional profile information
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- CONTACTS TABLE
-- Stores accountability contacts that users can assign to tasks
CREATE TABLE public.contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  relationship TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verification_token UUID DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Enable RLS on contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Contacts policies
CREATE POLICY "Users can CRUD their own contacts" 
  ON public.contacts 
  USING (auth.uid() = user_id);

-- TASKS TABLE
-- Core task management table
CREATE TABLE public.tasks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Tasks policies
CREATE POLICY "Users can CRUD their own tasks" 
  ON public.tasks 
  USING (auth.uid() = user_id);

-- ESCALATION_POLICIES TABLE
-- Defines how tasks escalate when deadlines are missed
CREATE TABLE public.escalation_policies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  task_id UUID REFERENCES public.tasks(id) NOT NULL,
  level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 3),
  minutes_after_due INTEGER NOT NULL,
  contact_id UUID REFERENCES public.contacts(id) NOT NULL,
  message_template TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on escalation_policies
ALTER TABLE public.escalation_policies ENABLE ROW LEVEL SECURITY;

-- Escalation policies policies
CREATE POLICY "Users can manage their own escalation policies" 
  ON public.escalation_policies 
  USING (EXISTS (
    SELECT 1 FROM public.tasks 
    WHERE tasks.id = escalation_policies.task_id 
    AND tasks.user_id = auth.uid()
  ));

-- ESCALATIONS TABLE
-- Records of actual escalation events that have occurred
CREATE TABLE public.escalations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  policy_id UUID REFERENCES public.escalation_policies(id) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')) DEFAULT 'pending',
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  message_content TEXT NOT NULL,
  delivery_receipt JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on escalations
ALTER TABLE public.escalations ENABLE ROW LEVEL SECURITY;

-- Escalations policies
CREATE POLICY "Users can view their own escalations" 
  ON public.escalations 
  USING (EXISTS (
    SELECT 1 FROM public.escalation_policies ep
    JOIN public.tasks t ON ep.task_id = t.id
    WHERE ep.id = escalations.policy_id
    AND t.user_id = auth.uid()
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_contacts_updated_at
BEFORE UPDATE ON public.contacts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_escalation_policies_updated_at
BEFORE UPDATE ON public.escalation_policies
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_escalations_updated_at
BEFORE UPDATE ON public.escalations
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert trigger for profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
