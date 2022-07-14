import { MathEngine } from "../../math/math_engine.mjs";


registerTestSuite("test Math engine algebraic add/subtract", ()=>{
  describe("Should add 1a+2a", ()=>{
    const math = new MathEngine('1a+2a');
    const steps = [];
    it("test step1", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('1a');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('2a');
      expect(step.changes[0]?.operator).toBe('add');
      expect(step.changes[0]?.resultNode?.toString()).toBe('3a');
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

  describe("Should test subtract 1a-3a", ()=>{
    const math = new MathEngine('1a-3a');
    const steps = [];
    it("Should test step1", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2)
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('1a');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('3a');
      expect(step.changes[0]?.operator).toBe('sub');
      expect(step.changes[0]?.resultNode?.toString()).toBe('-2a');
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
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('2a');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('2a');
      expect(step.changes[0]?.operator).toBe('sub')
      expect(step.changes[0]?.resultNode).toBe(null);
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
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('2a');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('a');
      expect(step.changes[0]?.operator).toBe('sub');
      expect(step.changes[0]?.resultNode?.toString()).toBe('a');
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
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2)
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('2a');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('-3a');
      expect(step.changes[0]?.operator).toBe('add');
      expect(step.changes[0]?.resultNode?.toString()).toBe('-a');
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
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('-2a');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('3a');
      expect(step.changes[0]?.operator).toBe('add');
      expect(step.changes[0]?.resultNode?.toString()).toBe('a');
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
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('-a');
      expect(step.changes[0]?.inputNodes[1].toString()).toBe('2a');
      expect(step.changes[0]?.operator).toBe('add');
      expect(step.changes[0]?.resultNode?.toString()).toBe('a');
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
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('a');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('-a');
      expect(step.changes[0]?.operator).toBe('sub')
      expect(step.changes[0]?.resultNode?.toString()).toBe('2a');
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
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('-2a');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('-3a');
      expect(step.changes[0]?.operator).toBe('sub');
      expect(step.changes[0]?.resultNode?.toString()).toBe('a');
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
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('a');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('a');
      expect(step.changes[0]?.operator).toBe('add');
      expect(step.changes[0]?.resultNode?.toString()).toBe('2a');
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
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('a');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('-a');
      expect(step.changes[0]?.operator).toBe('sub');
      expect(step.changes[0]?.resultNode?.toString()).toBe('2a');
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
  });
  describe("Should test binomial expr 2a+3ab-4a-2ab", ()=>{
    const math = new MathEngine('2a+3ab-4a-2ab');
    const steps = [];

    it("Should test step1 expr 2a+xx-4a-xx = -2a+3ab-2ab", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('2a');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('4a');
      expect(step.changes[0]?.resultNode?.toString()).toBe('-2a');
      steps.push(step);
    });
    it("Should test step1, xx+3ab-2ab == -2a+ab", ()=>{
      const step = steps[0];
      expect(step.changes[1]?.inputNodes?.length).toBe(2);
      expect(step.changes[1]?.inputNodes[0]?.toString()).toBe('3ab');
      expect(step.changes[1]?.inputNodes[1]?.toString()).toBe('2ab');
      expect(step.changes[1]?.operator).toBe('sub');
      expect(step.changes[1]?.resultNode?.toString()).toBe('ab');

    });
    it("Should not have a step2", ()=>{
      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(0)
      steps.push(step2);
    });
    it("Should have result", ()=>{
      expect(steps[0].tree.toString()).toBe('-2a+ab');
    });
  });

  describe("Should test polynomial expr -b+2a+3ab-4a-2ab+3b", ()=>{
    const math = new MathEngine('-b+2a+3ab-4a-2ab+3b', [],[], true);
    const steps = [];

    it("Should test step1 add expr -b+xx+xx-xx-xx-3b = 2b+2a+3ab-4a-2ab", ()=>{
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(3);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('-b');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('3b');
      expect(step.changes[0]?.operator).toBe('add');
      expect(step.changes[0]?.resultNode?.toString()).toBe('2b');
      steps.push(step);
    });
    it("Should test step1 expr xx+2a+xx-4a-xx = 2b-2a+3ab-ab", ()=>{
      const step = steps[0];
      expect(step.changes[1]?.inputNodes?.length).toBe(2);
      expect(step.changes[1]?.inputNodes[0]?.toString()).toBe('2a');
      expect(step.changes[1]?.inputNodes[1]?.toString()).toBe('4a');
      expect(step.changes[1]?.resultNode?.toString()).toBe('-2a');
      steps.push(step);
    });
    it("Should test step1, xx-xx+3ab-2ab == 2b-2a+ab", ()=>{
      const step = steps[0];
      expect(step.changes[2]?.inputNodes?.length).toBe(2);
      expect(step.changes[2]?.inputNodes[0]?.toString()).toBe('3ab');
      expect(step.changes[2]?.inputNodes[1]?.toString()).toBe('2ab');
      expect(step.changes[2]?.operator).toBe('sub');
      expect(step.changes[2]?.resultNode?.toString()).toBe('ab');
      expect(step.changes[2]?.resultNode?.parent===step.tree.left).toBe(false);

    });
    it("Should test '+-' conversion to '-'", ()=>{
      const step2= math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(step2.changes[0]?.inputNodes?.toString()).toBe('2b+-2a');
      expect(step2.changes[0]?.resultNode?.toString()).toBe('2b-2a');
      steps.push(step2);
    });
    it("Should not have a step2", ()=>{
      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(0)
      steps.push(step2);
    });
    it("Should have result", ()=>{
      expect(steps[0].tree.toString()).toBe('2b-2a+ab');
    });
  });
});
