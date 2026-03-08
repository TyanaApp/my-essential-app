-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public) VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read recipe images
CREATE POLICY "Public read recipe images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'recipe-images');

-- Allow authenticated users to upload recipe images
CREATE POLICY "Authenticated upload recipe images" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'recipe-images');