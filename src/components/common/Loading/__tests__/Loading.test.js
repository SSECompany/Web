import { render, screen } from '@testing-library/react';
import Loading from '../Loading';
import React from 'react';
import { useSelector } from 'react-redux';

// Mock react-redux
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

describe('Loading Component', () => {
  test('nên hiển thị nội dung khi loadingState là true', () => {
    useSelector.mockReturnValue(true);
    const { container } = render(<Loading />);
    const loadingDiv = container.firstChild;
    expect(loadingDiv).toHaveClass('show');
  });

  test('không hiển thị khi loadingState là false', () => {
    useSelector.mockReturnValue(false);
    const { container } = render(<Loading />);
    const loadingDiv = container.firstChild;
    expect(loadingDiv).not.toHaveClass('show');
  });
});
