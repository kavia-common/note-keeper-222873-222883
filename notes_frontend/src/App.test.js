import { render, screen } from '@testing-library/react';
import App from './App';

test('renders login or notes heading', () => {
  render(<App />);
  // Depending on auth state, either "Welcome" (login) or "Your Notes" (notes view)
  const heading = screen.getByText(/(Welcome|Your Notes)/i);
  expect(heading).toBeInTheDocument();
});
