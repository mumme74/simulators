import { MathEngine } from "../../math/math_engine.mjs";

function _value(solveNode) {
  if (solveNode?.type === 'mul' &&
      (solveNode?.right?.type === 'variable' &&
       (solveNode?.left?.type === 'integer' ||
        solveNode?.left?.type === 'variable')))
  {
    return '' + solveNode.left.value.value() +
                solveNode.right.value.value();
  }
  return solveNode?.value?.value()
}

function getValue(solveNode) {
  if (solveNode?.type === 'signed') {
    const vlu = _value(solveNode.left);
    return Number.isNaN(vlu) ? '-'+vlu : -vlu;
  }
  return _value(solveNode);
}

function getValueStr(solveNode) {
  return getValue(solveNode)?.toString();
}

registerTestSuite("test Math engine solveNextStep Constants", ()=>{
  describe("Test constant expressions", ()=>{
    it("Should sum 1+2-4", ()=>{
      const math = new MathEngine('1+2-4');

      const step = math.solveNextStep();
      expect(getValue(step.changes[0]?.beforeNode?.left)).toBe(1);
      expect(getValue(step.changes[0]?.beforeNode?.right)).toBe(2);
      expect(getValue(step.changes[1]?.beforeNode?.left)).toBe(3);
      expect(getValue(step.changes[1]?.beforeNode?.right)).toBe(4);

      expect(step.tree.left.value?.value()).toBe(-1);
    });
    it("Should sum 1+2-4+(-4-5)", ()=>{
      const math = new MathEngine('1+2-4+(-4-5)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.beforeNode?.left)).toBe(-4);
      expect(getValue(step.changes[0]?.beforeNode?.right)).toBe(5);

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(3);
      expect(getValue(step2.changes[0]?.beforeNode?.left)).toBe(1);
      expect(getValue(step2.changes[0]?.beforeNode?.right)).toBe(2);
      expect(getValue(step2.changes[1]?.beforeNode?.left)).toBe(3);
      expect(getValue(step2.changes[1]?.beforeNode?.right)).toBe(4);
      expect(getValue(step2.changes[2]?.beforeNode?.left)).toBe(-1);
      expect(getValue(step2.changes[2]?.beforeNode?.right)).toBe(-9);

      expect(step.tree.left.value?.value()).toBe(-10);
    });
    it("Should factor 1*2/4", ()=>{
      const math = new MathEngine('1*2/4');
      const step = math.solveNextStep();
      expect(getValue(step.changes[0]?.beforeNode?.left)).toBe(1);
      expect(getValue(step.changes[0]?.beforeNode?.right)).toBe(2);
      expect(getValue(step.changes[1]?.beforeNode?.left)).toBe(2);
      expect(getValue(step.changes[1]?.beforeNode?.right)).toBe(4);
      expect(step.tree.left.value?.value()).toBe(0.5);
    });
    it("Should factor 1*2*4/(-4*5)", ()=>{
      const math = new MathEngine('1*2*4/(-4*5)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.beforeNode?.left)).toBe(-4);
      expect(getValue(step.changes[0]?.beforeNode?.right)).toBe(5);

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(3);
      expect(getValue(step2.changes[0]?.beforeNode?.left)).toBe(1);
      expect(getValue(step2.changes[0]?.beforeNode?.right)).toBe(2);
      expect(getValue(step2.changes[1]?.beforeNode?.left)).toBe(2);
      expect(getValue(step2.changes[1]?.beforeNode?.right)).toBe(4);
      expect(getValue(step2.changes[2]?.beforeNode?.left)).toBe(8);
      expect(getValue(step2.changes[2]?.beforeNode?.right)).toBe(-20);

      expect(step.tree.left.value?.value()).toBe(-0.4);
    });
    it("Should exponent 2^4", ()=>{
      const math = new MathEngine('2^4');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.beforeNode?.left)).toBe(2);
      expect(getValue(step.changes[0]?.beforeNode?.right)).toBe(4);
      expect(step.tree.left.value?.value()).toBe(16);
    });
    it("Should factor 16^4^(-4+3)", ()=>{
      const math = new MathEngine('16^4^(-4+3)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.beforeNode?.left)).toBe(-4);
      expect(getValue(step.changes[0]?.beforeNode?.right)).toBe(3);

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(getValue(step2.changes[0]?.beforeNode?.left)).toBe(4);
      expect(getValue(step2.changes[0]?.beforeNode?.right)).toBe(-1);

      const step3 = math.solveNextStep();
      expect(step3.changes.length).toBe(1);
      expect(getValue(step3.changes[0]?.beforeNode?.left)).toBe(16);
      expect(getValue(step3.changes[0]?.beforeNode?.right)).toBe(0.25);
      expect(step.tree.left.value?.value()).toBe(2);
    });
    it("Should squareRoot √25", ()=>{
      const math = new MathEngine('√25');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.beforeNode?.left)).toBe(25);
      expect(step.tree.left.value?.value()).toBe(5);
    });
    it("Should cubeRoot 3√125", ()=>{
      const math = new MathEngine('3√125');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.beforeNode?.left)).toBe(3);
      expect(getValue(step.changes[0]?.beforeNode?.right)).toBe(125);
      expect(step.tree.left.value?.value()).toBe(5);
    });
  });

  describe("Test floating points constants", ()=>{
    it("Should sum 0.1+0.2-0.4", ()=>{
      const math = new MathEngine('0.1+0.2-0.4');
      const step = math.solveNextStep();
      expect(getValue(step.changes[0]?.beforeNode?.left)).toBe(0.1);
      expect(getValue(step.changes[0]?.beforeNode?.right)).toBe(0.2);
      expect(getValue(step.changes[1]?.beforeNode?.left)).toBe(0.3);
      expect(getValue(step.changes[1]?.beforeNode?.right)).toBe(0.4);

      expect(step.tree.left.value?.value()).toBe(-0.1);
    });
    it("Should sum 0.1+0.2-0.4+(-0.4-0.5)", ()=>{
      const math = new MathEngine('0.1+0.2-0.4+(-0.4-0.5)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.beforeNode?.left)).toBe(-0.4);
      expect(getValue(step.changes[0]?.beforeNode?.right)).toBe(0.5);

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(3);
      expect(getValue(step2.changes[0]?.beforeNode?.left)).toBe(0.1);
      expect(getValue(step2.changes[0]?.beforeNode?.right)).toBe(0.2);
      expect(getValue(step2.changes[1]?.beforeNode?.left)).toBe(0.3);
      expect(getValue(step2.changes[1]?.beforeNode?.right)).toBe(0.4);
      expect(getValue(step2.changes[2]?.beforeNode?.left)).toBe(-0.1);
      expect(getValue(step2.changes[2]?.beforeNode?.right)).toBe(-0.9);

      expect(step.tree.left.value?.value()).toBe(-1);
    });
    it("Should factor 0.1*0.2*0.4/(-0.4*0.5)", ()=>{
      const math = new MathEngine('0.1*0.2*0.4/(-0.4*0.5)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.beforeNode?.left)).toBe(-0.4);
      expect(getValue(step.changes[0]?.beforeNode?.right)).toBe(0.5);

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(3);
      expect(getValue(step2.changes[0]?.beforeNode?.left)).toBe(0.1);
      expect(getValue(step2.changes[0]?.beforeNode?.right)).toBe(0.2);
      expect(getValue(step2.changes[1]?.beforeNode?.left)).toBe(0.02);
      expect(getValue(step2.changes[1]?.beforeNode?.right)).toBe(0.4);
      expect(getValue(step2.changes[2]?.beforeNode?.left)).toBe(0.008);
      expect(getValue(step2.changes[2]?.beforeNode?.right)).toBe(-0.20);

      expect(step.tree.left.value?.value()).toBe(-0.04);
    });
    it("Should exponent 0.2^4", ()=>{
      const math = new MathEngine('0.2^4');
      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValue(step.changes[0]?.beforeNode?.left)).toBe(0.2);
      expect(getValue(step.changes[0]?.beforeNode?.right)).toBe(4);
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
      expect(getValueStr(step.changes[0]?.beforeNode?.left)).toBe('frac 1/2');
      expect(getValueStr(step.changes[0]?.beforeNode?.right)).toBe('frac 1/4');

      expect(step.tree.left.value?.value().toString()).toBe('frac 1/8');
    });
    it("Should multiply 1/2 * (1/4 * 1/6)", ()=>{
      const math = new MathEngine('frac1/2 * (frac1/4 * frac1/8)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(getValueStr(step.changes[0]?.beforeNode?.left)).toBe('frac 1/4');
      expect(getValueStr(step.changes[0]?.beforeNode?.right)).toBe('frac 1/8');

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(getValueStr(step2.changes[0]?.beforeNode?.left)).toBe('frac 1/2');
      expect(getValueStr(step2.changes[0]?.beforeNode?.right)).toBe('frac 1/32');

      expect(step.tree.left.value?.value().toString()).toBe('frac 1/64');
    });
    it("Should divide 1/2 / 1/4", ()=>{
      const math = new MathEngine('frac1/2 / frac1/4');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(getValueStr(step.changes[0]?.beforeNode)).toBe('frac 1/4');
      expect(getValueStr(step.changes[0]?.afterNode)).toBe('frac 4/1');
      expect(step.changes[1]?.beforeNode?.type).toBe('div');
      expect(step.changes[1]?.afterNode?.type).toBe('mul');

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(getValueStr(step2.changes[0]?.beforeNode?.left)).toBe('frac 1/2');
      expect(getValueStr(step2.changes[0]?.beforeNode?.right)).toBe('frac 4/1');

      const step3 = math.solveNextStep();
      expect(step3.changes.length).toBe(1);
      expect(getValueStr(step3.changes[0]?.beforeNode)).toBe('frac 4/2');

      expect(step.tree.left.value?.value().toString()).toBe('frac 2/1');
    });
    it("Should divide 1/2 / (1/4 / 1/6)", ()=>{
      const math = new MathEngine('frac1/2 / (frac1/4 / frac1/6)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(getValueStr(step.changes[0]?.beforeNode)).toBe('frac 1/6');
      expect(getValueStr(step.changes[0]?.afterNode)).toBe('frac 6/1');
      expect(step.changes[1]?.beforeNode?.type).toBe('div');
      expect(step.changes[1]?.afterNode?.type).toBe('mul');

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(getValueStr(step2.changes[0]?.beforeNode?.right)).toBe('frac 6/1');

      const step3 = math.solveNextStep();
      expect(step3.changes.length).toBe(1);
      expect(step3.changes[0]?.changeRule.name).toBe('SimplifyFractions');
      expect(getValueStr(step3.changes[0]?.beforeNode)).toBe('frac 6/4');
      expect(getValueStr(step3.changes[0]?.afterNode)).toBe('frac 3/2');

      const step4 = math.solveNextStep();
      expect(getValueStr(step4.changes[0]?.beforeNode)).toBe('frac 3/2');
      expect(getValueStr(step4.changes[0]?.afterNode)).toBe('frac 2/3');
      expect(step4.changes[1]?.beforeNode?.type).toBe('div');
      expect(step4.changes[1]?.afterNode?.type).toBe('mul');

      const step5 = math.solveNextStep();
      expect(getValueStr(step5.changes[0]?.beforeNode?.left)).toBe('frac 1/2');
      expect(getValueStr(step5.changes[0]?.beforeNode?.right)).toBe('frac 2/3');

      const step6 = math.solveNextStep();
      expect(getValueStr(step6.changes[0]?.beforeNode)).toBe('frac 2/6');
      expect(getValueStr(step6.changes[0]?.afterNode)).toBe('frac 1/3');

      expect(step.tree.left.value?.value().toString()).toBe('frac 1/3');
    });
    it("Should sum 1/2 + 1/4", ()=>{
      const math = new MathEngine('frac1/2 + frac1/4');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(2);
      expect(getValueStr(step.changes[0]?.beforeNode)).toBe('frac 1/2');
      expect(getValueStr(step.changes[0]?.afterNode)).toBe('frac 2/4');
      expect(getValueStr(step.changes[1]?.beforeNode?.left)).toBe('frac 2/4');
      expect(getValueStr(step.changes[1]?.beforeNode?.right)).toBe('frac 1/4');

      expect(step.tree.left.value?.value().toString()).toBe('frac 3/4');
    });
    it("Should sum 1/2 + 1/4 - 1/6 + (1/5 + 3/2)", ()=>{
      const math = new MathEngine('frac1/2 + frac1/4 - frac 1/6 + (frac1/5 + frac3/2)');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(3);
      expect(getValueStr(step.changes[0]?.beforeNode)).toBe('frac 1/5');
      expect(getValueStr(step.changes[0]?.afterNode)).toBe('frac 2/10');
      expect(getValueStr(step.changes[1]?.beforeNode)).toBe('frac 3/2');
      expect(getValueStr(step.changes[1]?.afterNode)).toBe('frac 15/10');
      expect(getValueStr(step.changes[2]?.beforeNode?.left)).toBe('frac 2/10');
      expect(getValueStr(step.changes[2]?.beforeNode?.right)).toBe('frac 15/10');
      expect(getValueStr(step.changes[2]?.afterNode)).toBe('frac 17/10');

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(5);
      expect(getValueStr(step2.changes[0]?.beforeNode)).toBe('frac 1/2');
      expect(getValueStr(step2.changes[1]?.beforeNode)).toBe('frac 1/4');
      expect(getValueStr(step2.changes[2]?.beforeNode)).toBe('frac 1/6');
      expect(getValueStr(step2.changes[3]?.beforeNode)).toBe('frac 17/10');
      expect(getValueStr(step2.changes[0]?.afterNode)).toBe('frac 30/60');
      expect(getValueStr(step2.changes[1]?.afterNode)).toBe('frac 15/60');
      expect(getValueStr(step2.changes[2]?.afterNode)).toBe('frac 10/60');
      expect(getValueStr(step2.changes[3]?.afterNode)).toBe('frac 102/60');
      // the actual first multiply
      expect(getValueStr(step2.changes[4]?.afterNode)).toBe('frac 45/60');

      const step3 = math.solveNextStep();
      expect(step3.changes.length).toBe(2);
      expect(getValueStr(step3.changes[0]?.afterNode)).toBe('frac 35/60');
      expect(getValueStr(step3.changes[1]?.afterNode)).toBe('frac 137/60');

      // should not reduce further
      const step4 = math.solveNextStep();
      expect(step4.changes.length).toBe(0);

      expect(step.tree.left.value?.value().toString()).toBe('frac 137/60');
    });
  });
});
