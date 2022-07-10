import { MathEngine } from "../../math/math_engine.mjs";

function getValue(solveNode) {
  if (solveNode?.type === 'signed')
    return -solveNode?.left.value?.value();
  return solveNode?.value?.value();
}

function getValueStr(solveNode) {
  return getValue(solveNode)?.toString();
}

registerTestSuite("test Math engine solveNextStep Constants", ()=>{
  describe("Test constant expressions", ()=>{
    it("Should sum 1+2-4", ()=>{
      const math = new MathEngine('1+2-4');

      const step = math.solveNextStep();
      expect(getValue(step.changes[0]?.originalLeft)).toBe(1);
      expect(getValue(step.changes[0]?.originalRight)).toBe(2);
      expect(getValue(step.changes[1]?.originalLeft)).toBe(3);
      expect(getValue(step.changes[1]?.originalRight)).toBe(4);

      expect(step.tree.left.value?.value()).toBe(-1);
    });
    it("Should sum 1+2-4+(-4-5)", ()=>{
      const math = new MathEngine('1+2-4+(-4-5)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.originalLeft)).toBe(-4);
      expect(getValue(step.changes[0]?.originalRight)).toBe(5);

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(3);
      expect(getValue(step2.changes[0]?.originalLeft)).toBe(1);
      expect(getValue(step2.changes[0]?.originalRight)).toBe(2);
      expect(getValue(step2.changes[1]?.originalLeft)).toBe(3);
      expect(getValue(step2.changes[1]?.originalRight)).toBe(4);
      expect(getValue(step2.changes[2]?.originalLeft)).toBe(-1);
      expect(getValue(step2.changes[2]?.originalRight)).toBe(-9);

      expect(step.tree.left.value?.value()).toBe(-10);
    });
    it("Should factor 1*2/4", ()=>{
      const math = new MathEngine('1*2/4');
      const step = math.solveNextStep();
      expect(getValue(step.changes[0]?.originalLeft)).toBe(1);
      expect(getValue(step.changes[0]?.originalRight)).toBe(2);
      expect(getValue(step.changes[1]?.originalLeft)).toBe(2);
      expect(getValue(step.changes[1]?.originalRight)).toBe(4);
      expect(step.tree.left.value?.value()).toBe(0.5);
    });
    it("Should factor 1*2*4/(-4*5)", ()=>{
      const math = new MathEngine('1*2*4/(-4*5)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.originalLeft)).toBe(-4);
      expect(getValue(step.changes[0]?.originalRight)).toBe(5);

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(3);
      expect(getValue(step2.changes[0]?.originalLeft)).toBe(1);
      expect(getValue(step2.changes[0]?.originalRight)).toBe(2);
      expect(getValue(step2.changes[1]?.originalLeft)).toBe(2);
      expect(getValue(step2.changes[1]?.originalRight)).toBe(4);
      expect(getValue(step2.changes[2]?.originalLeft)).toBe(8);
      expect(getValue(step2.changes[2]?.originalRight)).toBe(-20);

      expect(step.tree.left.value?.value()).toBe(-0.4);
    });
    it("Should exponent 2^4", ()=>{
      const math = new MathEngine('2^4');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.originalLeft)).toBe(2);
      expect(getValue(step.changes[0]?.originalRight)).toBe(4);
      expect(step.tree.left.value?.value()).toBe(16);
    });
    it("Should factor 16^4^(-4+3)", ()=>{
      const math = new MathEngine('16^4^(-4+3)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.originalLeft)).toBe(-4);
      expect(getValue(step.changes[0]?.originalRight)).toBe(3);

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(getValue(step2.changes[0]?.originalLeft)).toBe(4);
      expect(getValue(step2.changes[0]?.originalRight)).toBe(-1);

      const step3 = math.solveNextStep();
      expect(step3.changes.length).toBe(1);
      expect(getValue(step3.changes[0]?.originalLeft)).toBe(16);
      expect(getValue(step3.changes[0]?.originalRight)).toBe(0.25);
      expect(step.tree.left.value?.value()).toBe(2);
    });
    it("Should squareRoot √25", ()=>{
      const math = new MathEngine('√25');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.originalLeft)).toBe(25);
      expect(step.tree.left.value?.value()).toBe(5);
    });
    it("Should cubeRoot 3√125", ()=>{
      const math = new MathEngine('3√125');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.originalLeft)).toBe(3);
      expect(getValue(step.changes[0]?.originalRight)).toBe(125);
      expect(step.tree.left.value?.value()).toBe(5);
    });
  });

  describe("Test floating points constants", ()=>{
    it("Should sum 0.1+0.2-0.4", ()=>{
      const math = new MathEngine('0.1+0.2-0.4');
      const step = math.solveNextStep();
      expect(getValue(step.changes[0]?.originalLeft)).toBe(0.1);
      expect(getValue(step.changes[0]?.originalRight)).toBe(0.2);
      expect(getValue(step.changes[1]?.originalLeft)).toBe(0.3);
      expect(getValue(step.changes[1]?.originalRight)).toBe(0.4);

      expect(step.tree.left.value?.value()).toBe(-0.1);
    });
    it("Should sum 0.1+0.2-0.4+(-0.4-0.5)", ()=>{
      const math = new MathEngine('0.1+0.2-0.4+(-0.4-0.5)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.originalLeft)).toBe(-0.4);
      expect(getValue(step.changes[0]?.originalRight)).toBe(0.5);

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(3);
      expect(getValue(step2.changes[0]?.originalLeft)).toBe(0.1);
      expect(getValue(step2.changes[0]?.originalRight)).toBe(0.2);
      expect(getValue(step2.changes[1]?.originalLeft)).toBe(0.3);
      expect(getValue(step2.changes[1]?.originalRight)).toBe(0.4);
      expect(getValue(step2.changes[2]?.originalLeft)).toBe(-0.1);
      expect(getValue(step2.changes[2]?.originalRight)).toBe(-0.9);

      expect(step.tree.left.value?.value()).toBe(-1);
    });
    it("Should factor 0.1*0.2*0.4/(-0.4*0.5)", ()=>{
      const math = new MathEngine('0.1*0.2*0.4/(-0.4*0.5)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.originalLeft)).toBe(-0.4);
      expect(getValue(step.changes[0]?.originalRight)).toBe(0.5);

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(3);
      expect(getValue(step2.changes[0]?.originalLeft)).toBe(0.1);
      expect(getValue(step2.changes[0]?.originalRight)).toBe(0.2);
      expect(getValue(step2.changes[1]?.originalLeft)).toBe(0.02);
      expect(getValue(step2.changes[1]?.originalRight)).toBe(0.4);
      expect(getValue(step2.changes[2]?.originalLeft)).toBe(0.008);
      expect(getValue(step2.changes[2]?.originalRight)).toBe(-0.20);

      expect(step.tree.left.value?.value()).toBe(-0.04);
    });
    it("Should exponent 0.2^4", ()=>{
      const math = new MathEngine('0.2^4');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.originalLeft)).toBe(0.2);
      expect(getValue(step.changes[0]?.originalRight)).toBe(4);
      expect(step.tree.left.value?.value()).toBe(0.0016);
    });
  });
});


registerTestSuite("test Math engine solveNextStep Fractions", ()=>{
  describe("Test Fraction Constants", ()=>{
    it("Should multiply frac 1/2 * frac 1/4", ()=>{
      const math = new MathEngine('frac1/2 * frac1/4');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValueStr(step.changes[0]?.originalLeft)).toBe('frac 1/2');
      expect(getValueStr(step.changes[0]?.originalRight)).toBe('frac 1/4');

      expect(step.tree.left.value?.value().toString()).toBe('frac 1/8');
    });
    it("Should multiply 1/2 * (1/4 * 1/6)", ()=>{
      const math = new MathEngine('frac1/2 * (frac1/4 * frac1/8)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValueStr(step.changes[0]?.originalLeft)).toBe('frac 1/4');
      expect(getValueStr(step.changes[0]?.originalRight)).toBe('frac 1/8');

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(getValueStr(step2.changes[0]?.originalLeft)).toBe('frac 1/2');
      expect(getValueStr(step2.changes[0]?.originalRight)).toBe('frac 1/32');

      expect(step.tree.left.value?.value().toString()).toBe('frac 1/64');
    });
    it("Should divide 1/2 / 1/4", ()=>{
      const math = new MathEngine('frac1/2 / frac1/4');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(getValueStr(step.changes[0]?.original)).toBe('frac 1/4');
      expect(getValueStr(step.changes[0]?.triggerNode)).toBe('frac 4/1');
      expect(step.changes[1]?.original?.type).toBe('div');
      expect(step.changes[1]?.triggerNode?.type).toBe('mul');

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(getValueStr(step2.changes[0]?.originalLeft)).toBe('frac 1/2');
      expect(getValueStr(step2.changes[0]?.originalRight)).toBe('frac 4/1');

      const step3 = math.solveNextStep();
      expect(step3.changes.length).toBe(1);
      expect(getValueStr(step3.changes[0]?.original)).toBe('frac 4/2');

      expect(step.tree.left.value?.value().toString()).toBe('frac 2/1');
    });
    it("Should divide 1/2 / (1/4 / 1/6)", ()=>{
      const math = new MathEngine('frac1/2 / (frac1/4 / frac1/6)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(getValueStr(step.changes[0]?.original)).toBe('frac 1/6');
      expect(getValueStr(step.changes[0]?.triggerNode)).toBe('frac 6/1');
      expect(step.changes[1]?.original?.type).toBe('div');
      expect(step.changes[1]?.triggerNode?.type).toBe('mul');

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(getValueStr(step2.changes[0]?.originalRight)).toBe('frac 6/1');

      const step3 = math.solveNextStep();
      expect(step3.changes.length).toBe(1);
      expect(step3.changes[0]?.changeRule.name).toBe('SimplifyMulDivFractions');
      expect(getValueStr(step3.changes[0]?.original)).toBe('frac 6/4');
      expect(getValueStr(step3.changes[0]?.triggerNode)).toBe('frac 3/2');

      const step4 = math.solveNextStep();
      expect(getValueStr(step4.changes[0]?.original)).toBe('frac 3/2');
      expect(getValueStr(step4.changes[0]?.triggerNode)).toBe('frac 2/3');
      expect(step4.changes[1]?.original?.type).toBe('div');
      expect(step4.changes[1]?.triggerNode?.type).toBe('mul');

      const step5 = math.solveNextStep();
      expect(getValueStr(step5.changes[0]?.originalLeft)).toBe('frac 1/2');
      expect(getValueStr(step5.changes[0]?.originalRight)).toBe('frac 2/3');

      const step6 = math.solveNextStep();
      expect(getValueStr(step6.changes[0]?.original)).toBe('frac 2/6');
      expect(getValueStr(step6.changes[0]?.triggerNode)).toBe('frac 1/3');

      expect(step.tree.left.value?.value().toString()).toBe('frac 1/3');
    });
    it("Should sum 1/2 + 1/4 - 1/6", ()=>{});
    it("Should sum 1/2 + 1/4 - 1/6 + (1/5 + 3/2)", ()=>{});
  });
});

registerTestSuite("test Math engine solveNextStep algebra", ()=>{
  /*describe("Test Algebraic expressions", ()=>{
    it("Should add 1a+2a", ()=>{
      const math = new MathEngine('1a+2a');
      expect(math.solveNextStep()).toBeObj(['3a']);
    });
  });*/
});
