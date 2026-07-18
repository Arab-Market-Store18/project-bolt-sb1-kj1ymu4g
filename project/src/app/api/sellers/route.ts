// ������: app/api/sellers/route.ts
// ������ �������� �������� ���� ������ ������
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
export async function POST(request: Request) {
  const cookieStore = await cookies();
  const supabase = createServerClient({ cookies: () => cookieStore });
  let userId: string | null = null;
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const businessName = formData.get('businessName') as string; 
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const country = formData.get('country') as string;
    const city = formData.get('city') as string;
    const phoneNumbersJson = formData.get('phone_numbers') as string;
    const storeType = formData.get('store_type') as string;
    const physicalAddress = formData.get('physical_address') as string | null;
    const logoFile = formData.get('logo') as File | null;
    const storeImageFile = formData.get('store_image') as File | null;
    if (!email || !password || !businessName) {
        return NextResponse.json({ message: "������ ����������� ���� �����ѡ ���� ������ ���� �������." }, { status: 400 });
    }
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      if (authError.message.includes("User already registered")) {
        return NextResponse.json({ message: "��� ������ ���������� ���� ������." }, { status: 409 });
      }
      throw new Error(`Auth Error: ${authError.message}`);
    }
    if (!authData.user) throw new Error("��� ����� ���� ��������.");
    userId = authData.user.id;
    let logoUrl: string | null = null;
    if (logoFile) {
      const logoFileName = `${userId}/logo-${uuidv4()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('seller-assets').upload(logoFileName, logoFile);
      if (uploadError) throw new Error(`Logo Upload Error: ${uploadError.message}`);
      logoUrl = supabase.storage.from('seller-assets').getPublicUrl(uploadData.path).data.publicUrl;
    }
    let storeImageUrl: string | null = null;
    if (storeImageFile) {
      const storeImageFileName = `${userId}/store-${uuidv4()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from('seller-assets').upload(storeImageFileName, storeImageFile);
      if (uploadError) throw new Error(`Store Image Upload Error: ${uploadError.message}`);
      storeImageUrl = supabase.storage.from('seller-assets').getPublicUrl(uploadData.path).data.publicUrl;
    }
    const phoneNumbers = phoneNumbersJson ? JSON.parse(phoneNumbersJson) : [];
    const whatsappNumberObject = phoneNumbers.find((p: any) => p.type === 'whatsapp');
    const whatsappNumber = whatsappNumberObject ? whatsappNumberObject.number : null;
    const { error: sellerError } = await supabase
      .from('sellers')
      .insert({
        id: userId,
        auth_user_id: userId,
        business_name: businessName, 
        description: description,
        category: category,
        country: country,
        city: city,
        email: email,
        logo_url: logoUrl,
        store_image_url: storeImageUrl,
        store_type: storeType,
        physical_address: physicalAddress,
        phone_numbers: phoneNumbers,
        whatsapp_number: whatsappNumber, // <-- �� ������� ���
      });
    if (sellerError) throw new Error(`Seller Insert Error: ${sellerError.message}`);
    return NextResponse.json({ message: "�� ����� ������ �����!" }, { status: 201 });
  } catch (error: any) {
    if (userId) {
      const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error('Failed to delete user after error:', deleteError.message);
      }
    }
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  }