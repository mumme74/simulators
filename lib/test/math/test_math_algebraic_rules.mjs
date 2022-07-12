import { MathEngine } from "../../math/math_engine.mjs";


registerTestSuite("test Math engine algebraic add/subtract", ()=>{
  /*describe("Should add 1a+2a", ()=>{
    const math = new MathEngine('1a+2a');
    const steps = [];
    it("test step1", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.beforeNode?.toString()).toBe('2a');
      expect(step.changes[1]?.beforeNode?.left?.toString()).toBe('1a');
      expect(step.changes[1]?.beforeNode?.type).toBe('add');
      expect(step.changes[1]?.afterNode?.toString()).toBe('3a');
      steps.push(step);
    });
    it("Should not have a step2", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(0);
      steps.push(step);
    });
    it("should have result", ()=>{
      expect(steps[0].tree.toString()).toBe('3a');
    });
  });

  describe("Should test subract 1a-3a", ()=>{
    const math = new MathEngine('1a-3a');
    const steps = [];
    it("Should test step1", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.beforeNode?.toString()).toBe('3a');
      expect(step.changes[1]?.beforeNode?.left?.toString()).toBe('1a');
      expect(step.changes[1]?.beforeNode?.type).toBe('sub');
      expect(step.changes[1]?.afterNode?.toString()).toBe('-2a');
      steps.push(step);
    });

    it("Should not have a step2", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(0);
      steps.push(step);
    });
    it("Should have result", ()=>{
      expect(steps[0].tree.toString()).toBe('-2a');
    });
  });
  describe("Should test cancel out 2a-2a = ''", ()=>{
    const math = new MathEngine('2a-2a');
    const steps = [];
    it("Should test step1", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.beforeNode?.toString()).toBe('2a');
      expect(step.changes[1]?.beforeNode?.left?.toString()).toBe('2a');
      expect(step.changes[1]?.afterNode?.toString()).toBe('');
      steps.push(step);
    });
    it("Shoul not have a step2", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(0);
      steps.push(step);
    });
    it("SHould have result", ()=>{
      expect(steps[0].tree.toString()).toBe('');
    });
  });
  describe("Should test remove coeficient 2a -a = a", ()=>{
    const math = new MathEngine('2a-a');
    const steps = [];
    it("Should test step1", ()=>{

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.beforeNode?.toString()).toBe('a');
      expect(step.changes[1]?.beforeNode?.left?.toString()).toBe('2a');
      expect(step.changes[1]?.beforeNode?.type).toBe('sub');
      expect(step.changes[1]?.afterNode?.toString()).toBe('a');
      steps.push(step);
    });
    it("Should not have a step2", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(0);
      steps.push(step);
    });
    it("Should have result", ()=>{
      expect(steps[0].tree.toString()).toBe('a');
    });
  });
  describe("Should test going to negative 2a+-3a", ()=>{
    const math = new MathEngine('2a+-3a');
    const steps = [];
    it("Should test step1", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.beforeNode?.toString()).toBe('-3a');
      expect(step.changes[1]?.beforeNode?.left?.toString()).toBe('2a');
      expect(step.changes[1]?.beforeNode?.type).toBe('add');
      expect(step.changes[1]?.afterNode?.toString()).toBe('-a');
      steps.push(step);
    });
    it("Should not have a step2", ()=>{
      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(0)
    });
    it("Should have result", ()=>{
      expect(steps[0].tree.toString()).toBe('-a');
    })
  });
  describe("Should test going positive from negative -2a+3a", ()=>{
    const math = new MathEngine('-2a+3a');
    const steps = [];

    it("test step1", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.beforeNode?.toString()).toBe('3a');
      expect(step.changes[1]?.beforeNode?.left?.toString()).toBe('-2a');
      expect(step.changes[1]?.beforeNode?.type).toBe('add');
      expect(step.changes[1]?.afterNode?.toString()).toBe('a');
      steps.push(step);
    });
    it("Should not have a step2", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(0);
      steps.push(step);
    });
    it("Should have result", ()=>{
      expect(steps[0].tree.toString()).toBe('a');
    });
  });
  describe("Should test negative -a+2a", ()=>{
    const math = new MathEngine('-a+2a');
    const steps = [];
    it("Should test step1", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.beforeNode?.toString()).toBe('2a');
      expect(step.changes[1]?.beforeNode?.left?.toString()).toBe('-a');
      expect(step.changes[1]?.beforeNode?.type).toBe('add');
      expect(step.changes[1]?.afterNode?.toString()).toBe('a');
      steps.push(step);
    });
    it("Should not have a step2", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(0)
      steps.push(step);
    });
    it("Should have result", ()=>{
      expect(steps[0].tree.toString()).toBe('a');
    });
  });
  describe("Should test right negative a--a", ()=>{
    const math = new MathEngine('a--a');
    const steps = [];
    it("Should test step1", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.beforeNode?.toString()).toBe('-a');
      expect(step.changes[1]?.beforeNode?.left?.toString()).toBe('a');
      expect(step.changes[1]?.beforeNode?.type).toBe('sub')
      expect(step.changes[1]?.afterNode?.toString()).toBe('2a');
    });
    it("Should not have a step2", ()=>{
      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(0);
      steps.push(step2);
    });
    it("Should have result", ()=>{
      expect(steps[0].tree.toString()).toBe('2a');
    });
  });
  describe("Should test both negative -2a--3a", ()=>{
    const math = new MathEngine('-2a--3a');
    const steps = [];
    it("Should test step1", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.beforeNode?.toString()).toBe('-3a');
      expect(step.changes[1]?.beforeNode?.left?.toString()).toBe('-2a');
      expect(step.changes[1]?.beforeNode?.type).toBe('sub');
      expect(step.changes[1]?.afterNode?.toString()).toBe('a');
      steps.push(step);
    });
    it("Should not have a step2", ()=>{
      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(0)
    });
    it("Should have result", ()=>{
      expect(steps[0].tree.toString()).toBe('a');
    });
  });
  describe("Should test both positive a++a", ()=>{
    const math = new MathEngine('+a++a');
    const steps = [];
    it("Should test step2", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.beforeNode?.toString()).toBe('a');
      expect(step.changes[1]?.beforeNode?.left?.toString()).toBe('a');
      expect(step.changes[1]?.afterNode?.toString()).toBe('2a');
      steps.push(step);
    });
    it ("Should not have a step2", ()=>{
      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(0);
      steps.push(step2);
    });
    it("Should have result", ()=>{
      expect(steps[0].tree.toString()).toBe('2a');
    });
  });
  describe("Should test 2 in group, a-(-a)", ()=>{
    const math = new MathEngine('a-(-a)');
    const steps = [];
    it("Should test 2 in group == a-(-a)", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.beforeNode?.toString()).toBe('-a');
      expect(step.changes[1]?.beforeNode?.left?.toString()).toBe('a');
      expect(step.changes[1]?.beforeNode?.type).toBe('sub');
      expect(step.changes[1]?.afterNode?.toString()).toBe('2a');
      steps.push(step);
    });
    it("Should not have a step2", ()=>{
      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(0);
      steps.push(step2);
    });
    it("Should have result", ()=>{
      expect(steps[0].tree.toString()).toBe('2a');
    });
  });*/
  describe("Should test binomial expr 2a+3ab-4a-2ab", ()=>{
    const math = new MathEngine('2a+3ab-4a-2ab');
    const steps = [];

    it("Should test step1 expr 2a+xx-4a-xx = -2a+3ab-2ab", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(4);
      expect(step.changes[0]?.beforeNode?.toString()).toBe('4a');
      expect(step.changes[1]?.beforeNode?.left?.toString()).toBe('2a');
      expect(step.changes[1]?.beforeNode?.left?.toString()).toBe('2a');
      steps.push(step);
    });
    it("Should test step1, xx+3ab-2ab == -2a+ab", ()=>{
      const step = steps[0];
      expect(step.changes[2]?.beforeNode?.toString()).toBe('2ab');
      expect(step.changes[3]?.beforeNode?.right?.toString()).toBe('3ab');
      expect(step.changes[3]?.beforeNode?.right?.toString()).toBe('2ab');

      expect(step.changes[1]?.afterNode?.toString()).toBe('-2a');
      expect(step.changes[2]?.afterNode?.toString()).toBe('ab');

    });
    it("Should not have a step2", ()=>{
      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(0)
      steps.push(step2);
    });
    it("Should have result", ()=>{
      expect(steps[0].tree.toString()).toBe('2a+ab');
    });
  });
});
