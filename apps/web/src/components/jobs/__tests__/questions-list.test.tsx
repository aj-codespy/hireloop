import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QuestionsList } from '../questions-list';
import type { Question } from '@/lib/types';

describe('QuestionsList', () => {
  const mockProps = {
    jobId: "job-1",
    questions: [] as Question[],
    onEdit: jest.fn(),
    onReorder: jest.fn(),
    onDelete: jest.fn(),
    interviewQuestionCount: null,
    onInterviewCountChange: jest.fn(),
  };

  it('renders empty state when no questions', () => {
    render(<QuestionsList {...mockProps} />);
    expect(screen.getByText('No questions configured for this job.')).toBeInTheDocument();
  });

  it('renders question cards with section badges', () => {
    const questions: Question[] = [{
      id: 'q-1', section: 'technical', promptText: 'Explain closures',
      idealAnswerNotes: 'Scope chain', timeLimitSeconds: 90, isActive: true, isMandatory: true,
      scoreThreshold: null, order: 1, questionBankId: 'qb-1', jobRoleId: 'job-1'
    }];
    render(<QuestionsList {...mockProps} questions={questions} />);
    expect(screen.getByText('Explain closures')).toBeInTheDocument();
    expect(screen.getByText('Mandatory')).toBeInTheDocument();
    expect(screen.getAllByText(/technical/i)).toHaveLength(2);
  });

  it('renders variable badge for non-mandatory questions', () => {
    const questions: Question[] = [{
      id: 'q-1', section: 'situational', promptText: 'Handle conflict',
      idealAnswerNotes: '', timeLimitSeconds: null, isActive: true, isMandatory: false,
      scoreThreshold: null, order: 1, questionBankId: 'qb-1', jobRoleId: 'job-1'
    }];
    render(<QuestionsList {...mockProps} questions={questions} />);
    expect(screen.getByText('Variable')).toBeInTheDocument();
  });

  it('shows inactive badge when question is inactive', () => {
    const questions: Question[] = [{
      id: 'q-1', section: 'hr', promptText: 'Why this company?',
      idealAnswerNotes: '', timeLimitSeconds: null, isActive: false, isMandatory: false,
      scoreThreshold: null, order: 1, questionBankId: 'qb-1', jobRoleId: 'job-1'
    }];
    render(<QuestionsList {...mockProps} questions={questions} />);
    expect(screen.getAllByText('Inactive')).toHaveLength(2);
  });

  it('shows time limit when set', () => {
    const questions: Question[] = [{
      id: 'q-1', section: 'technical', promptText: 'Time limited',
      idealAnswerNotes: '', timeLimitSeconds: 120, isActive: true, isMandatory: true,
      scoreThreshold: null, order: 1, questionBankId: 'qb-1', jobRoleId: 'job-1'
    }];
    render(<QuestionsList {...mockProps} questions={questions} />);
    expect(screen.getByText('120s')).toBeInTheDocument();
  });
});