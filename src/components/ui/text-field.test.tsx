import { fireEvent } from '@testing-library/react-native';

import { renderWithProviders } from '@/test-utils/render';

import { TextField } from './text-field';

describe('TextField', () => {
  it('labels the input for screen readers and reports typing', async () => {
    const onChangeText = jest.fn();
    const { getByLabelText } = await renderWithProviders(
      <TextField label="Email address" value="" onChangeText={onChangeText} />
    );

    const input = getByLabelText('Email address');
    await fireEvent.changeText(input, 'ada@example.org');
    expect(onChangeText).toHaveBeenCalledWith('ada@example.org');
  });

  it('masks a password until the member reveals it', async () => {
    const { getByLabelText } = await renderWithProviders(
      <TextField label="Password" value="secret123" secure />
    );

    expect(getByLabelText('Password').props.secureTextEntry).toBe(true);

    await fireEvent.press(getByLabelText('Show password'));
    expect(getByLabelText('Password').props.secureTextEntry).toBe(false);

    await fireEvent.press(getByLabelText('Hide password'));
    expect(getByLabelText('Password').props.secureTextEntry).toBe(true);
  });

  it('shows the validation message and marks the field invalid', async () => {
    const { getByText, getByLabelText } = await renderWithProviders(
      <TextField label="Access code" value="ab" error="That access code is not recognised." />
    );

    expect(getByText('That access code is not recognised.')).toBeTruthy();
    expect(getByLabelText('Access code').props['aria-invalid']).toBe(true);
  });

  it('shows a hint when there is no error', async () => {
    const { getByText } = await renderWithProviders(
      <TextField label="Phone number" value="" hint="Optional. For urgent pastoral contact only." />
    );

    expect(getByText('Optional. For urgent pastoral contact only.')).toBeTruthy();
  });
});
