import React from 'react';
import { render } from '@testing-library/react';
import Hero from './page';

describe('Hero component', () => {
  it('renders without crashing', () => {
    const { container } = render(<Hero />);
    expect(container).toBeTruthy();
  });
});