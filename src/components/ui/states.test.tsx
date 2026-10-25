import { fireEvent } from '@testing-library/react-native';

import { ApiError } from '@/api/errors';
import { renderWithProviders } from '@/test-utils/render';

import { EmptyState, ErrorState } from './states';

describe('EmptyState', () => {
  it('shows copy written for the specific absence and runs its action', async () => {
    const onPress = jest.fn();
    const { getByText, getByLabelText } = await renderWithProviders(
      <EmptyState
        title="Nothing saved yet"
        message="Tap the bookmark on a sermon and it will be here."
        action={{ label: 'Browse sermons', onPress }}
      />
    );

    expect(getByText('Nothing saved yet')).toBeTruthy();
    expect(getByText('Tap the bookmark on a sermon and it will be here.')).toBeTruthy();

    await fireEvent.press(getByLabelText('Browse sermons'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('ErrorState', () => {
  it('offers a retry for a failure that could succeed next time', async () => {
    const onRetry = jest.fn();
    const { getByText, getByLabelText } = await renderWithProviders(
      <ErrorState error={new ApiError('network', 'Could not reach the server.')} onRetry={onRetry} />
    );

    expect(getByText('Could not reach Kingdom Heralds')).toBeTruthy();
    await fireEvent.press(getByLabelText('Try again'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('does not offer a retry when retrying cannot help', async () => {
    const { getByText, queryByLabelText } = await renderWithProviders(
      <ErrorState
        error={new ApiError('forbidden', 'This content is restricted.', { status: 403 })}
        onRetry={jest.fn()}
      />
    );

    expect(getByText('You do not have access')).toBeTruthy();
    expect(queryByLabelText('Try again')).toBeNull();
  });

  it('shows app copy rather than a raw server error', async () => {
    const { getByText, queryByText } = await renderWithProviders(
      <ErrorState error={new ApiError('server', 'SQLSTATE[HY000] connection refused')} />
    );

    expect(queryByText(/SQLSTATE/)).toBeNull();
    expect(getByText('Something broke on our side')).toBeTruthy();
  });
});
