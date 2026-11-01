import { useMutation } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { describeError, fieldError } from '@/api/errors';
import { AuthShell } from '@/components/app/auth-shell';
import { useToast } from '@/components/app/toast';
import { DefaultAvatar, defaultAvatars } from '@/components/ui/avatar';
import { MemberAvatar } from '@/components/ui/member-avatar';
import { Pressable } from '@/components/ui/pressable';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useColors } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { useAvatarChoice } from '@/features/auth/avatar-choice';
import { updateProfile, uploadAvatar } from '@/features/auth/api';
import { useAuth } from '@/features/auth/store';
import { profileSchema, validate, type FieldErrors } from '@/lib/validation';

export default function EditProfileScreen() {
  const router = useRouter();
  const toast = useToast();
  const member = useAuth((state) => state.member);
  const setMember = useAuth((state) => state.setMember);
  const colors = useColors();
  const choice = useAvatarChoice((state) => state.choice);
  const setChoice = useAvatarChoice((state) => state.set);

  const [values, setValues] = useState({
    name: member?.name ?? '',
    phone: member?.phone ?? '',
    city: member?.city ?? '',
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const save = useMutation({
    mutationFn: () =>
      updateProfile({
        name: values.name,
        phone: values.phone.trim() === '' ? null : values.phone,
        city: values.city.trim() === '' ? null : values.city,
      }),
    onSuccess: (updated) => {
      setMember(updated);
      toast('Profile updated.', { tone: 'success', icon: 'user' });
      router.back();
    },
    onError: (error) =>
      setErrors({
        name: fieldError(error, 'name'),
        phone: fieldError(error, 'phone'),
        city: fieldError(error, 'city'),
      }),
  });

  const avatar = useMutation({
    mutationFn: async () => {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        throw new Error('Photo access was declined, so nothing was changed.');
      }
      const picked = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (picked.canceled || !picked.assets[0]) return null;
      const asset = picked.assets[0];
      return uploadAvatar({
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? 'profile.jpg',
      });
    },
    onSuccess: (updated) => {
      if (!updated) return;
      setMember(updated);
      // A photograph replaces a chosen avatar.
      setChoice(null);
      toast('Profile picture updated.', { tone: 'success', icon: 'camera' });
    },
  });

  if (!member) {
    return (
      <AuthShell title="Profile" description="Sign in to edit your profile.">
        <Button label="Sign in" fullWidth onPress={() => router.replace('/sign-in')} />
      </AuthShell>
    );
  }

  const saveError = save.error ? describeError(save.error) : null;
  const avatarError = avatar.error;

  return (
    <AuthShell
      title="Your profile"
      description="The church uses these details to reach you. Your email is managed by the church office."
    >
      {saveError && Object.keys(errors).length === 0 ? (
        <Banner tone="danger" title={saveError.title} message={saveError.message} />
      ) : null}

      <View style={styles.avatarRow}>
        <MemberAvatar size="xl" />
        <View style={styles.avatarActions}>
          <Button
            label="Change picture"
            variant="secondary"
            size="sm"
            icon="camera"
            loading={avatar.isPending}
            onPress={() => avatar.mutate()}
          />
          <Text variant="caption" color="textTertiary">
            A square photo works best.
          </Text>
        </View>
      </View>

      <View style={styles.picker}>
        <Text variant="labelStrong">Or choose an avatar</Text>
        <View style={styles.pickerGrid}>
          {defaultAvatars.map((avatarOption) => {
            const selected = choice === avatarOption.key;
            return (
              <Pressable
                key={avatarOption.key}
                onPress={() => setChoice(avatarOption.key)}
                feedback="opacity"
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={avatarOption.label}
                style={[
                  styles.pickerItem,
                  { borderColor: selected ? colors.ink : 'transparent' },
                ]}
              >
                <DefaultAvatar avatarKey={avatarOption.key} dimension={52} />
              </Pressable>
            );
          })}
        </View>
      </View>

      {avatarError ? (
        <Banner
          tone="warning"
          title="The picture was not changed"
          message={
            avatarError instanceof Error && avatarError.name !== 'ApiError'
              ? avatarError.message
              : describeError(avatarError).message
          }
        />
      ) : null}

      <TextField
        label="Full name"
        value={values.name}
        onChangeText={(value) => setValues((current) => ({ ...current, name: value }))}
        error={errors.name}
        autoComplete="name"
        icon="user"
      />
      <TextField
        label="Phone number"
        value={values.phone}
        onChangeText={(value) => setValues((current) => ({ ...current, phone: value }))}
        error={errors.phone}
        hint="Used for urgent pastoral contact only."
        keyboardType="phone-pad"
        icon="phone"
      />
      <TextField
        label="City"
        value={values.city}
        onChangeText={(value) => setValues((current) => ({ ...current, city: value }))}
        error={errors.city}
        hint="Helps the church connect you with a nearby cell group."
        icon="map-pin"
      />

      <View style={styles.readOnly}>
        <Text variant="metaStrong" color="textSecondary">
          Email address
        </Text>
        <Text variant="body">{member.email}</Text>
        <Text variant="caption" color="textTertiary">
          Contact the church office to change the email on your membership record.
        </Text>
      </View>

      <Button label="Save changes" fullWidth loading={save.isPending} onPress={() => {
        const result = validate(profileSchema, values);
        if (!result.ok) {
          setErrors(result.errors);
          return;
        }
        setErrors({});
        save.mutate();
      }} />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  picker: {
    gap: space.md,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  pickerItem: {
    padding: 3,
    borderWidth: 2,
    borderRadius: radius.pill,
    minHeight: 0,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
  },
  avatarActions: {
    flex: 1,
    gap: space.xs,
    alignItems: 'flex-start',
  },
  readOnly: {
    gap: 2,
  },
});
