import { MathEngine } from "../../math/math_engine.mjs";


registerTestSuite("test Math engine solveNextStep Constants integers", ()=>{
  describe("Test constant expressions", ()=>{
    it("Should sum 1+2-4", ()=>{
      const math = new MathEngine('1+2-4');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(+step.changes[0]?.inputNodes[0]?.toString()).toBe(1);
      expect(+step.changes[0]?.inputNodes[1]?.toString()).toBe(2);
      expect(step.changes[0]?.operator).toBe('add');
      expect(+step.changes[0]?.resultNode?.toString()).toBe(3);

      expect(step.changes[1]?.inputNodes?.length).toBe(2);
      expect(+step.changes[1]?.inputNodes[0]?.toString()).toBe(3);
      expect(+step.changes[1]?.inputNodes[1]?.toString()).toBe(4);
      expect(step.changes[1]?.operator).toBe('sub');
      expect(+step.changes[1]?.resultNode?.toString()).toBe(-1);

      expect(step.tree.left.value?.value()).toBe(-1);
    });

    it("Should sum 1+2-4+(-4-5)", ()=>{
      const math = new MathEngine('1+2-4+(-4-5)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(+step.changes[0]?.inputNodes[0]?.toString()).toBe(-4);
      expect(+step.changes[0]?.inputNodes[1]?.toString()).toBe(5);
      expect(step.changes[0]?.operator).toBe('sub');
      expect(+step.changes[0]?.resultNode?.toString()).toBe(-9)

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(3);
      expect(step2.changes[0]?.inputNodes?.length).toBe(2);
      expect(+step2.changes[0]?.inputNodes[0]?.toString()).toBe(1);
      expect(+step2.changes[0]?.inputNodes[1]?.toString()).toBe(2);
      expect(step2.changes[0]?.operator)?.toBe('add')
      expect(+step2.changes[1]?.inputNodes[0]?.toString()).toBe(3);
      expect(+step2.changes[1]?.inputNodes[1]?.toString()).toBe(4);
      expect(step2.changes[1]?.operator)?.toBe('sub')
      expect(+step2.changes[2]?.inputNodes[0]?.toString()).toBe(-1);
      expect(+step2.changes[2]?.inputNodes[1]?.toString()).toBe(-9);
      expect(step2.changes[2]?.operator)?.toBe('add');

      expect(step.tree.left.value?.value()).toBe(-10);
    });

    it("Should factor 1*2/4", ()=>{
      const math = new MathEngine('1*2/4');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(+step.changes[0]?.inputNodes[0]?.toString()).toBe(1);
      expect(+step.changes[0]?.inputNodes[1]?.toString()).toBe(2);
      expect(step.changes[0]?.operator).toBe('mul');
      expect(+step.changes[0]?.resultNode?.toString()).toBe(2);

      expect(step.changes[1]?.inputNodes?.length).toBe(2);
      expect(+step.changes[1]?.inputNodes[0]?.toString()).toBe(2);
      expect(+step.changes[1]?.inputNodes[1]?.toString()).toBe(4);
      expect(step.changes[1]?.operator).toBe('div');
      expect(+step.changes[1]?.resultNode?.toString()).toBe(0.5);

      expect(step.tree.left.value?.value()).toBe(0.5);
    });


    it("Should factor 1*2*4/(-4*5)", ()=>{
      const math = new MathEngine('1*2*4/(-4*5)');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(+step.changes[0]?.inputNodes[0]?.toString()).toBe(-4);
      expect(+step.changes[0]?.inputNodes[1]?.toString()).toBe(5);
      expect(step.changes[0]?.operator).toBe('mul');
      expect(+step.changes[0]?.resultNode?.toString()).toBe(-20)

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(2);
      expect(step2.changes[0]?.inputNodes?.length).toBe(4);
      expect(+step2.changes[0]?.inputNodes[0]?.toString()).toBe(1);
      expect(+step2.changes[0]?.inputNodes[1]?.toString()).toBe(2);
      expect(+step2.changes[0]?.inputNodes[2]?.toString()).toBe(2);
      expect(+step2.changes[0]?.inputNodes[3]?.toString()).toBe(4);
      expect(step2.changes[0]?.operator)?.toBe('mul');
      expect(step2.changes[1]?.inputNodes?.length).toBe(2);
      expect(+step2.changes[1]?.inputNodes[0]?.toString()).toBe(8);
      expect(+step2.changes[1]?.inputNodes[1]?.toString()).toBe(-20);
      expect(step2.changes[1]?.operator)?.toBe('div');

      expect(step.tree.left.value?.value()).toBe(-0.4);
    });

    it("Should exponent 2^4", ()=>{
      const math = new MathEngine('2^4');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(+step.changes[0]?.inputNodes[0]?.toString()).toBe(2);
      expect(+step.changes[0]?.inputNodes[1]?.toString()).toBe(4);
      expect(step.changes[0]?.operator).toBe('exp');
      expect(step.tree.left.value?.value()).toBe(16);
    });

    it("Should factor 16^4^(-4+3)", ()=>{
      const math = new MathEngine('16^4^(-4+3)');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(+step.changes[0]?.inputNodes[0]?.toString()).toBe(-4);
      expect(+step.changes[0]?.inputNodes[1]?.toString()).toBe(3);
      expect(step.changes[0]?.operator).toBe('add');
      expect(+step.changes[0]?.resultNode?.toString()).toBe(-1)

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(step2.changes[0]?.inputNodes?.length).toBe(2);
      expect(+step2.changes[0]?.inputNodes[0]?.toString()).toBe(4);
      expect(+step2.changes[0]?.inputNodes[1]?.toString()).toBe(-1);
      expect(step2.changes[0]?.operator)?.toBe('exp');

      const step3 = math.solveNextStep();
      expect(step3.changes.length).toBe(1);
      expect(step3.changes[0]?.inputNodes?.length).toBe(2);
      expect(+step3.changes[0]?.inputNodes[0]?.toString()).toBe(16);
      expect(+step3.changes[0]?.inputNodes[1]?.toString()).toBe(0.25);

      expect(step.tree.left.value?.value()).toBe(2);
    });

    it("Should squareRoot √25", ()=>{
      const math = new MathEngine('√25');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(1)
      expect(+step.changes[0]?.inputNodes[0]?.toString()).toBe(25);
      expect(step.changes[0]?.operator).toBe('root')
      expect(step.tree.left.value?.value()).toBe(5);
    });

    it("Should cubeRoot 3√125", ()=>{
      const math = new MathEngine('3√125');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(+step.changes[0]?.inputNodes[0]?.toString()).toBe(3);
      expect(+step.changes[0]?.inputNodes[1]?.toString()).toBe(125);
      expect(step.tree.left.value?.value()).toBe(5);
    });
  });
});

registerTestSuite("test Math engine solveNextStep Constants floats", ()=>{
  describe("Test floating points constants", ()=>{
    it("Should sum 0.1+0.2-0.4", ()=>{
      const math = new MathEngine('0.1+0.2-0.4');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(+step.changes[0]?.inputNodes[0]?.toString()).toBe(0.1);
      expect(+step.changes[0]?.inputNodes[1]?.toString()).toBe(0.2);
      expect(step.changes[0]?.operator).toBe('add');

      expect(step.changes[1]?.inputNodes?.length).toBe(2)
      expect(+step.changes[1]?.inputNodes[0]?.toString()).toBe(0.3);
      expect(+step.changes[1]?.inputNodes[1]?.toString()).toBe(0.4);
      expect(step.changes[1]?.operator).toBe('sub');

      expect(step.tree.left.value?.value()).toBe(-0.1);
    });

    it("Should sum 0.1+0.2-0.4+(-0.4-0.5)", ()=>{
      const math = new MathEngine('0.1+0.2-0.4+(-0.4-0.5)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0].inputNodes?.length).toBe(2)
      expect(+step.changes[0]?.inputNodes[0]?.toString()).toBe(-0.4);
      expect(+step.changes[0]?.inputNodes[1]?.toString()).toBe(0.5);

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(3);
      expect(step2.changes[0]?.inputNodes?.length).toBe(2)
      expect(+step2.changes[0]?.inputNodes[0]?.toString()).toBe(0.1);
      expect(+step2.changes[0]?.inputNodes[1]?.toString()).toBe(0.2);
      expect(+step2.changes[1]?.inputNodes[0]?.toString()).toBe(0.3);
      expect(+step2.changes[1]?.inputNodes[1]?.toString()).toBe(0.4);
      expect(+step2.changes[2]?.inputNodes[0]?.toString()).toBe(-0.1);
      expect(+step2.changes[2]?.inputNodes[1]?.toString()).toBe(-0.9);

      expect(step.tree.left.value?.value()).toBe(-1);
    });

    it("Should factor 0.1*0.2*0.4/(-0.4*0.5)", ()=>{
      const math = new MathEngine('0.1*0.2*0.4/(-0.4*0.5)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2);
      expect(+step.changes[0]?.inputNodes[0]?.toString()).toBe(-0.4);
      expect(+step.changes[0]?.inputNodes[1]?.toString()).toBe(0.5);

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(2);
      expect(step2.changes[0]?.inputNodes?.length).toBe(4);
      expect(+step2.changes[0]?.inputNodes[0]?.toString()).toBe(0.1);
      expect(+step2.changes[0]?.inputNodes[1]?.toString()).toBe(0.2);
      expect(step2.changes[0]?.operator).toBe('mul')
      expect(+step2.changes[0]?.inputNodes[2]?.toString()).toBe(0.02);
      expect(+step2.changes[0]?.inputNodes[3]?.toString()).toBe(0.4);
      expect(+step2.changes[1]?.inputNodes[0]?.toString()).toBe(0.008);
      expect(+step2.changes[1]?.inputNodes[1]?.toString()).toBe(-0.20);
      expect(step2.changes[1]?.operator).toBe('div');

      expect(step.tree.left.value?.value()).toBe(-0.04);
    });

    it("Should exponent 0.2^4", ()=>{
      const math = new MathEngine('0.2^4');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes?.length).toBe(2)
      expect(+step.changes[0]?.inputNodes[0]?.toString()).toBe(0.2);
      expect(+step.changes[0]?.inputNodes[1]?.toString()).toBe(4);
      expect(step.tree.left.value?.value()).toBe(0.0016);
    });
  });
});
