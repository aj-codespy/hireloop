# Implementation Plan: Complete HireLoop Frontend Redesign Pipeline

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

## Goal
Complete the entire frontend redesign pipeline for HireLoop, transitioning from the initial design system foundation to full production-ready user flows with immersive UX and visual coherence across all screens.

## Architecture

Implement a modern React/Next.js frontend with:
- Tailwind CSS design system using existing `.elev-1/-2/-3`, `.text-gradient`, `.reveal` classes
- Component-based architecture with reusable UI library (Card, Button, Input, etc.)
- Progressive multi-step flows for complex user journeys
- Smooth animations and micro-interactions using Framer Motion/HoverLift
- Responsive design with mobile optimization
- Integration with existing HireLoop backend (FastAPI/SQLite/Supabase)

## Tech Stack

- Frontend: React 18, Next.js 16, TypeScript
- Styling: Tailwind CSS (existing design system)
- Animation: Framer Motion (via HoverLift component)
- State Management: React Context/Zustand where appropriate
- HTTP: http_pool integration (existing HireLoop API client)
- Build: Next.js build pipeline with TypeScript strict mode

---

## Task 1: Complete Welcome Tour Implementation (Phase 3.1)
**Priority: 🔴 HIGH - Immediate Impact + Closes Signup Journey**

### Objective
Build the guided onboarding tour for new companies after signup, creating a polished introduction to HireLoop’s key features.

**Files:**
- Create: `src/app/admin/welcome/page.tsx` (main welcome tour page)
- Create: `src/components/onboarding/WelcomeTour.tsx` (reusable guided tour component)
- Create: `src/components/onboarding/WelcomeStep.tsx` (individual tour step component)
- Create: `src/hooks/useWelcomeTour.ts` (tour state management)
- Test: `tests/components/onboarding.test.tsx`

**Step 1: Write failing test**
```typescript
def test_welcome_tour_renders_complete_tour():
    result = render(<WelcomeTour />)
    expect(result.getByText(/Create your first job posting/)).toBeInTheDocument()
    expect(result.getByText(/Setup interview questions/)).toBeInTheDocument()
    expect(result.getByRole('button', { name: /Start tour/i })).toBeInTheDocument()
```

**Step 2: Run test to verify failure**
Run: `pnpm test -- src/components/onboarding.test.tsx -v`
Expected: FAIL - Component doesn't exist yet

**Step 3: Write minimal implementation**
```typescript
// WelcomeTour.tsx - Main tour wrapper
export function WelcomeTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  const steps = [
    {
      title: 'Welcome to HireLoop',
      description: 'Create your first job posting and start screening candidates',
      icon: BriefcaseIcon,
      target: '#first-job-btn'
    },
    // ... more steps
  ];
  
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-title text-gradient mb-4">Welcome to HireLoop</h1>
          <p className="text-body text-muted-foreground">
            Let’s get your hiring journey started with a quick tour of the key features
          </p>
        </div>
        
        <WelcomeStep 
          step={steps[currentStep]}
          onComplete={() => setCurrentStep(currentStep + 1)}
          isLastStep={currentStep === steps.length - 1}
        />
      </div>
    </div>
  );
}
```

**Step 4: Run test to verify pass**
Run: `pnpm test -- src/components/onboarding.test.tsx -v`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/onboarding/WelcomeTour.tsx src/components/onboarding/WelcomeStep.tsx
git add src/components/onboarding/WelcomeTour.test.tsx
src/components/onboarding/useWelcomeTour.ts
git commit -m "feat: implement guided onboarding welcome tour"
```

---

## Task 2: Fix JobQuestionsEditor Scrolling Bug (Phase 4.1)
**Priority: 🔴 HIGH - Critical UX Fix**

### Objective  
Resolve the accordion collapse issue preventing smooth scrolling when adding new questions to the job posting form.

**Files:**
- Modify: `src/components/admin/jobs/JobQuestionsEditor.tsx:45-89` (scroll behavior)
- Modify: `src/components/ui/accordion.tsx:12-34` (accordion controls)
- Modify: `src/hooks/useJobQuestions.ts:78-95` (question addition logic)
- Test: `tests/components/admin/jobs/JobQuestionsEditor.test.tsx` (add scrolling tests)

**Step 1: Write failing test**
```typescript
def test_job_question_addition_scrolls_to_view():
    render(<JobQuestionsEditor jobId="test-job" />)
    
    // Add first question
    fireEvent.click(screen.getByText(/Add Question/))
    
    // Verify new question is in viewport
    const newQuestion = screen.getByText(/New Question/)
    expect(newQuestion).toBeInTheDocument()
    
    // Verify scroll behavior (check if element is visible)
    const questionElement = newQuestion.closest('[data-radix-accordion-item]')
    expect(questionElement).toHaveClass('data-[state=open]:bg-brand/10')
```

**Step 2: Run test to verify failure**
Run: `pnpm test -- src/components/admin/jobs/JobQuestionsEditor.test.tsx::test_job_question_addition_scrolls_to_view -v`
Expected: FAIL - Accordion component not responding to state changes properly

**Step 3: Write minimal implementation**
```typescript
// JobQuestionsEditor.tsx - Add smooth scroll behavior
useEffect(() => {
  if (newQuestionId) {
    const element = document.getElementById(`question-${newQuestionId}`)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest' 
      })
      
      // Ensure accordion item is open
      const trigger = element.querySelector('[data-radix-accordion-trigger]')
      if (trigger) {
        trigger.click()
      }
    }
  }
}, [newQuestionId])
```

**Step 4: Run test to verify pass**
Run: `pnpm test -- src/components/admin/jobs/JobQuestionsEditor.test.tsx -v`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/admin/jobs/JobQuestionsEditor.tsx
git add src/components/ui/accordion.tsx
git add src/hooks/useJobQuestions.ts
git commit -m "fix: resolve question-add scrolling in JobQuestionsEditor"
```

---

## Task 3: Implement Interview Flow Fixes (Phase 5.1)
**Priority: 🔴 HIGH - Core Functionality**

### Objective
Fix interview scheduling flow (phase handling, skip/pause functionality) to ensure smooth candidate journey.

**Files:**
- Create: `src/components/candidate/InterviewFlow.tsx` (new flow wrapper)
- Create: `src/components/candidate/InterviewPhase.tsx` (phase-specific UI)
- Modify: `src/hooks/useInterviewFlow.ts` (new flow state management)
- Modify: `src/components/interview/InterviewScheduler.tsx:67-89` (add skip/pause logic)
- Test: `tests/components/candidate/InterviewFlow.test.tsx`

**Step 1: Write failing test**
```typescript
def test_interview_flow_restores_progress_on_skip():
    const { result, waitForNext } = renderHook(() => useInterviewFlow())
    
    // Start interview
    act(() => result.current.startInterview('job-123', 'candidate-456'))
    
    // Complete first phase
    act(() => result.current.completePhase('phase-1'))
    
    // Skip second phase
    act(() => result.current.skipPhase('phase-2'))
    
    // Verify progress is preserved
    expect(result.current.progress.completedPhases).toContain('phase-1')
    expect(result.current.progress.skippedPhases).toContain('phase-2')
    expect(result.current.progress.currentPhase).toBe('phase-3')
```

**Step 2: Run test to verify failure**
Run: `pnpm test -- src/hooks/useInterviewFlow.test.tsx -v`
Expected: FAIL - Hook doesn't exist yet

**Step 3: Write minimal implementation**
```typescript
// useInterviewFlow.ts - Implement interview flow logic
export function useInterviewFlow() {
  const [state, setState] = useState({
    currentJobId: null as string | null,
    currentCandidateId: null as string | null,
    currentPhase: 'phase-1',
    completedPhases: [] as string[],
    skippedPhases: [] as string[],
    interviewHistory: [],
    isLoading: false,
    error: null as string | null
  })
  
  const startInterview = (jobId: string, candidateId: string) => {
    setState(prev => ({
      ...prev,
      currentJobId: jobId,
      currentCandidateId: candidateId,
      currentPhase: 'phase-1',
      error: null
    }))
  }
  
  const completePhase = (phaseId: string) => {
    setState(prev => ({
      ...prev,
      completedPhases: [...prev.completedPhases, phaseId],
      currentPhase: getNextPhase(phaseId)
    }))
  }
  
  const skipPhase = (phaseId: string) => {
    setState(prev => ({
      ...prev,
      skippedPhases: [...prev.skippedPhases, phaseId],
      currentPhase: getNextPhase(phaseId)
    }))
  }
  
  return {
    ...state,
    startInterview,
    completePhase,
    skipPhase
  }
}
```

**Step 4: Run test to verify pass**
Run: `pnpm test -- src/hooks/useInterviewFlow.test.tsx -v`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/candidate/InterviewFlow.tsx
git add src/components/candidate/InterviewPhase.tsx
git add src/hooks/useInterviewFlow.ts
git commit -m "feat: implement robust interview flow with skip/pause"
```

---

## Task 4: Implement Admin Pipeline View (Phase 6.1)
**Priority: 🟡 MEDIUM - Enhancement**

### Objective
Build a kanban-style pipeline view for interview stages with drag-to-stage functionality and analytics.

**Files:**
- Create: `src/components/admin/interviews/InterviewPipeline.tsx` (kanban pipeline)
- Create: `src/components/admin/interviews/PipelineStage.tsx` (individual stage component)
- Create: `src/hooks/useInterviewPipeline.ts` (pipeline state management)
- Modify: `src/components/admin/InterviewsPage.tsx:123-167` (add pipeline tab)
- Test: `tests/components/admin/interviews/InterviewPipeline.test.tsx`

**Step 1: Write failing test**
```typescript
def test_pipeline_stage_renders_with_correct_count():
    const stages = [
        { id: 'screening', title: 'Screening', count: 5, color: 'bg-blue-500' },
        { id: 'interview', title: 'Interview', count: 3, color: 'bg-orange-500' },
        { id: 'offer', title: 'Offer', count: 2, color: 'bg-green-500' }
    ]
    
    render(<PipelineStage stage={stages[0]} />)
    
    expect(screen.getByText('Screening')).toBeInTheDocument()
    expect(screen.getByText('5 candidates')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Move candidates/ })).toBeInTheDocument()
```

**Step 2: Run test to verify failure**
Run: `pnpm test -- src/components/admin/interviews/InterviewPipeline.test.tsx -v`
Expected: FAIL - Pipeline component doesn't exist yet

**Step 3: Write minimal implementation**
```typescript
// InterviewPipeline.tsx - Kanban pipeline implementation
export function InterviewPipeline() {
  const [pipelineData, setPipelineData] = useState([
    { id: 'screening', title: 'Screening', count: 5, color: 'bg-blue-500', candidates: [] },
    { id: 'interview', title: 'Interview', count: 3, color: 'bg-orange-500', candidates: [] },
    { id: 'offer', title: 'Offer', count: 2, color: 'bg-green-500', candidates: [] },
    { id: 'hired', title: 'Hired', count: 1, color: 'bg-purple-500', candidates: [] }
  ])
  
  const handleDragStart = (e: DragEvent, candidateId: string, fromStage: string) => {
    e.dataTransfer.setData('candidateId', candidateId)
    e.dataTransfer.setData('fromStage', fromStage)
  }
  
  const handleDrop = (e: DragEvent, toStage: string) => {
    e.preventDefault()
    const candidateId = e.dataTransfer.getData('candidateId')
    const fromStage = e.dataTransfer.getData('fromStage')
    
    setPipelineData(prev => prev.map(stage => {
      if (stage.id === toStage) {
        return {
          ...stage,
          candidates: [...stage.candidates, { id: candidateId, name: `Candidate ${candidateId}` }]
        }
      }
      if (stage.id === fromStage) {
        return {
          ...stage,
          candidates: stage.candidates.filter(c => c.id !== candidateId)
        }
      }
      return stage
    }))
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {pipelineData.map(stage => (
        <PipelineStage
          key={stage.id}
          stage={stage}
          onDragStart={handleDragStart}
          onDrop={handleDrop}
        />
      ))}
    </div>
  )
}
```

**Step 4: Run test to verify pass**
Run: `pnpm test -- src/components/admin/interviews/InterviewPipeline.test.tsx -v`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/admin/interviews/InterviewPipeline.tsx
git add src/components/admin/interviews/PipelineStage.tsx
git add src/hooks/useInterviewPipeline.ts
git commit -m "feat: implement kanban interview pipeline with drag-to-stage"
```

---

## Task 5: Complete Mobile Responsiveness (Phase 8.1)
**Priority: 🟢 LOW - Quality Assurance**

### Objective
Audit and fix all mobile views for responsive compatibility across all components.

**Files:**
- Modify: `src/components/admin/InterviewsPage.tsx:89-117` (add responsive breakpoints)
- Modify: `src/components/ui/Card.tsx:45-67` (mobile card padding)
- Modify: `src/components/ui/Button.tsx:34-56` (mobile button sizes)
- Create: `tests/responsive.spec.tsx` (responsive design tests)

**Step 1: Write failing test**
```typescript
def test_interviews_page_mobile_layout():
    const { width } = require('screen')
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true })
    
    render(<InterviewsPage />)
    
    // Verify mobile-specific classes
    const mainContainer = screen.getByTestId('interviews-container')
    expect(mainContainer).toHaveClass('px-4') // Mobile padding
    expect(mainContainer).not.toHaveClass('md:px-8') // Desktop padding
    
    // Verify mobile navigation
    const navigation = screen.getByRole('navigation')
    expect(navigation).toHaveClass('bottom-0') // Bottom nav on mobile
```

**Step 2: Run test to verify failure**
Run: `pnpm test -- src/components/admin/InterviewsPage.test.tsx::test_interviews_page_mobile_layout -v`
Expected: FAIL - Responsive breakpoints not implemented

**Step 3: Write minimal implementation**
```typescript
// InterviewsPage.tsx - Add responsive breakpoints
const getContainerClasses = () => {
    return `mx-auto px-4 py-6 
           ${width >= 768 ? 'max-w-6xl md:px-8' : ''} 
           ${width >= 1024 ? 'lg:px-12' : ''}`
  }
  
  // Add effect to handle resize
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth)
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
```

**Step 4: Run test to verify pass**
Run: `pnpm test -- src/components/admin/InterviewsPage.test.tsx -v`
Expected: PASS

**Step 5: Commit**
```bash
git add src/components/admin/InterviewsPage.tsx
git add src/components/ui/Card.tsx
git add src/components/ui/Button.tsx
git add tests/responsive.spec.tsx
git commit -m "fix: implement mobile responsive design across components"
```

---

## Task 6: Final Verification and Testing (Task 9.1)
**Priority: 🟢 LOW - Quality Assurance**

### Objective
Implement visual regression test script and ensure all components pass comprehensive testing.

**Files:**
- Create: `scripts/visual-regression/test/**/*.spec.ts` (visual regression tests)
- Create: `scripts/visual-regression/snapshot/**/*-snap.html` (baseline snapshots)
- Modify: `package.json` (add visual test scripts)
- Test: All tests in `tests/`

**Step 1: Write failing test**
```typescript
def test_interviews_page_visual_regression() {
  const component = <InterviewsPage />
  expect(component).toMatchSnapshot()
}
```

**Step 2: Run test to verify failure**
Run: `pnpm test -- tests/components/admin/InterviewsPage.test.tsx::test_interviews_page_visual_regression -v`
Expected: FAIL - Snapshot doesn't exist yet

**Step 3: Write minimal implementation**
Update package.json:
```json
"scripts": {
  "test:visual": "playwright test scripts/visual-regression/test/",
  "test:visual:update": "playwright test --update-snapshots scripts/visual-regression/test/",
  "test:component": "jest src/components/",
  "test:all": "pnpm test:component && pnpm test:visual"
}
```

```typescript
// Add visual regression wrapper
describe('InterviewsPage - Visual Regression', () => {
  beforeEach(() => {
    // Set up viewport for mobile/desktop tests
    device === 'mobile' ? setViewport(375) : setViewport(1440)
  })
  
  it('matches snapshot on desktop', () => {
    expect(component).toMatchSnapshot()
  })
  
  it('matches snapshot on mobile', () => {
    expect(component).toMatchSnapshot()
  })
})
```

**Step 4: Run test to verify pass**
Run: `pnpm test:all`
Expected: PASS

**Step 5: Commit**
```bash
git add package.json scripts/visual-regression/test/*.spec.ts
git add scripts/visual-regression/snapshot/
git add scripts/visual-regression/configs/
git commit -m "feat: add comprehensive visual regression testing"
```

---

## Delivery Artifacts

After implementing all tasks via `subagent-driven-development`:

### Generated Files
- `.hermes/plans/2026-07-22_18_45_00-implementation-plan-for-hireloop-frontend-redesign.md` (this plan)
- New components and files as listed above
- Updated existing components with fixes
- Comprehensive test coverage

### Build Verification
```bash
# Standard testing
pnpm test:all
pnpm test:visual  # Visual regression tests
pnpm lint                # Lint checks
pnpm type-check          # TypeScript strict

# Component testing
pnpm test:component -- --coverage
pnpm test:visual -- --screenshots

# Integration testing  
pnpm run build
```

### Expected Test Results
```
✓ InterviewsPage - Visual Regression
✓ JobQuestionsEditor - Accordion scrolling
✓ InterviewFlow - Skip/pause functionality
✓ InterviewPipeline - Kanban drag-to-stage
✓ MultiStepSignUp - Complete 4-step flow
✓ WelcomeTour - Guided onboarding
✓ All components - Responsive design

Total Tests: 25 | Passed: 25 | Failed: 0
Coverage: 94%
```

---

## Risk Mitigation

### High Priority Risks
1. **Accordion Scroll Bug** - Fixed by implementing smooth scrolling with `scrollIntoView`
2. **Mobile Layout Breaks** - Mitigated by comprehensive responsive breakpoints in all components
3. **Interview Flow Complexity** - Managed through clear state management and phase progression logic

### Medium Priority Risks
4. **Component Integration** - Each new component built with existing patterns and dependencies
5. **Performance Issues** - Optimized with React.memo and useMemo where applicable

### Low Priority Risks
6. **Visual Regression** - Managed with snapshot testing and baseline updates
7. **Testing Coverage** - Incremental approach with component-level tests first

---

## Documentation

### Updated Documentation
- `docs/api.md` - All frontend routes documented
- `docs/environment.md` - Development environment setup
- Component documentation in `/components/**/*.md` files

### New Documentation
- `README.md` - Updated with deployment and testing instructions
- `COMPONENT_GUIDE.md` - Component usage documentation
- `MOBILE_GUIDE.md` - Mobile development best practices

---

## Monitoring & Maintenance

### Post-Deployment Checks
```bash
# Health checks
curl -X GET http://localhost:3000/api/health

# Performance monitoring
curl -X GET http://localhost:3000/api/metrics

# Component validation
curl -X GET http://localhost:3000/api/components/status
```

### Ongoing Maintenance
- Daily visual regression test runs
- Weekly dependency updates
- Monthly mobile compatibility audits
- Quarterly component refresh

---

## Success Criteria

✅ **Complete Implementation:** All frontend components and functionality built
✅ **Design System Integration:** Full use of existing Tailwind design system
✅ **User Experience:** Progressive flows, smooth animations, intuitive navigation
✅ **Quality Assurance:** Comprehensive test coverage, visual regression testing
✅ **Mobile Optimization:** Responsive design across all screen sizes
✅ **Performance:** Optimized rendering and state management
✅ **Documentation:** Complete component and development documentation

---

*Plan prepared for Hermes with focus on bite-sized tasks, comprehensive implementation, and production-ready delivery.*

*Ready for execution via subagent-driven-development. All components follow HireLoop design system, Meet legal requirements, and deliver smooth UX across all platforms.*