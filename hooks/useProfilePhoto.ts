import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/lib/supabase';
import { useStore } from '@/store/useStore';

export function useProfilePhoto() {
  const { user, updateProfile } = useStore();
  const { t } = useTranslation();
  const [isUploading, setIsUploading] = useState(false);

  const uploadNewPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });

      if ((result as any).canceled || !result.assets || !result.assets[0].base64) return;

      setIsUploading(true);
      const file = (result as any).assets[0];
      const fileExt = file.uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, decode(file.base64 || ''), {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const response = await updateProfile({ avatar_url: data.publicUrl });
      if (!response.success) throw response.error;

      Alert.alert(t('common.success'), t('profile.photo.updated'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.generic_error'));
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = async () => {
    try {
      setIsUploading(true);

      if (user?.avatar) {
        const urlParts = user.avatar.split('/avatars/');
        if (urlParts.length === 2) {
          const filePath = `avatars/${urlParts[1]}`;
          const { error: deleteError } = await supabase.storage.from('avatars').remove([filePath]);
          if (deleteError) console.warn('Storage deletion warning:', deleteError);
        }
      }

      const response = await updateProfile({ avatar_url: null });
      if (!response.success) throw response.error;

      Alert.alert(t('common.success'), t('profile.photo.removed'));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.generic_error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditPhoto = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('common.permission_denied'), t('profile.permissions.gallery_needed'));
        return;
      }

      Alert.alert(
        t('profile.photo.edit_title'),
        t('profile.photo.edit_desc'),
        [
          { text: t('common.choose_new'), onPress: uploadNewPhoto },
          {
            text: t('common.remove'),
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                t('common.confirm'),
                t('profile.photo.remove_confirm'),
                [
                  { text: t('common.cancel'), style: 'cancel' },
                  { text: t('common.remove'), style: 'destructive', onPress: removePhoto },
                ]
              );
            },
          },
          { text: t('common.cancel'), style: 'cancel' },
        ]
      );
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('common.generic_error'));
    }
  };

  return { isUploading, handleEditPhoto };
}
