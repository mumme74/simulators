
import { MathEngine } from "../../math/math_engine.mjs";

registerTestSuite("test Math engine solveNextStep Fractions", ()=>{
  describe("Test Fraction Constants", ()=>{
    it("Should multiply frac{1/2} * frac{1/4}", ()=>{
      const math = new MathEngine('frac{1/2} * frac{1/4}');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0].inputNodes?.length).toBe(3);
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('frac{1/2}');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('frac{1/4}');
      expect(step.changes[0]?.inputNodes[2]?.type).toBe('mul');

      expect(step.tree.left.value?.value().toString()).toBe('frac{1/8}');
    });

    it("Should multiply 1/2 * (1/4 * 1/6)", ()=>{
      const math = new MathEngine('frac{1/2} * (frac{1/4} * frac{1/8})',[],[], true);

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(1);
      expect(step.changes[0]?.inputNodes.length).toBe(3)
      expect(step.changes[0]?.inputNodes[0]?.toString()).toBe('frac{1/4}');
      expect(step.changes[0]?.inputNodes[1]?.toString()).toBe('frac{1/8}');
      expect(step.changes[0]?.inputNodes[2]?.type).toBe('mul');

      const step2 = math.solveNextStep();
      expect(step2.changes.length).toBe(1);
      expect(step2.changes[0]?.inputNodes[0]?.toString()).toBe('frac{1/2}');
      expect(step2.changes[0]?.inputNodes[1]?.toString()).toBe('frac{1/32}');

      expect(step.tree.left.value?.value().toString()).toBe('frac{1/64}');
    });

    it("Should divide 1/2 / 1/4", ()=>{
      const math = new MathEngine('frac{1/2} / frac{1/4}');

      const step = math.solveNextStep();
      expect(step.changes.length).toBe(3);
      const ch0 = step.changes[0],
            ch1 = step.changes[1],
            ch2 = step.changes[2];
      expect(ch0?.inputNodes?.length).toBe(1);
      expect(ch0?.inputNodes[0]?.toString()).toBe('frac{1/4}');
      expect(ch0?.resultNode.toString()).toBe('frac{4/1}');
      expect(ch0?.operator).toBe('div');

      expect(ch1?.inputNodes?.length).toBe(1);
      expect(ch1?.inputNodes[0]?.type).toBe('div');
      expect(ch1?.resultNode?.type).toBe('mul');
      expect(ch1?.operator).toBe('div');

      expect(ch2?.inputNodes[0]?.toString()).toBe('frac{1/2}');
      expect(ch2?.inputNodes[1]?.toString()).toBe('frac{4/1}');
      expect(ch2?.resultNode?.toString()).toBe('frac{4/2}');

      const st1 = math.solveNextStep().changes;
      expect(st1[0]?.changeRule.name).toBe('SimplifyFractions');
      expect(st1[0]?.inputNodes[0].toString()).toBe('frac{4/2}');
      expect(st1[0]?.resultNode.toString()).toBe('frac{2/1}');

      expect(step.tree.left.value?.value().toString()).toBe('frac{2/1}');
    });

    it("Should divide 1/2 / (1/4 / 1/6)", ()=>{
      const math = new MathEngine('frac{1/2} / (frac{1/4} / frac{1/6})');

      let step = math.solveNextStep();
      let st0 = step.changes;
      expect(step.changes.length).toBe(3);
      expect(st0[0]?.inputNodes?.length).toBe(1)
      expect(st0[0]?.inputNodes[0]?.toString()).toBe('frac{1/6}');
      expect(st0[0]?.resultNode.toString()).toBe('frac{6/1}');
      expect(st0[0]?.operator).toBe('div');

      expect(st0[1]?.inputNodes.length).toBe(1);
      expect(st0[1]?.inputNodes[0]?.type).toBe('div');
      expect(st0[1]?.resultNode?.type).toBe('mul');

      expect(st0[2]?.inputNodes[0].toString()).toBe('frac{1/4}');
      expect(st0[2]?.inputNodes[1].toString()).toBe('frac{6/1}');
      expect(st0[2]?.resultNode.toString()).toBe('frac{6/4}');


      const st1 = math.solveNextStep().changes;
      expect(st1[0]?.changeRule.name).toBe('SimplifyFractions');
      expect(st1[0]?.inputNodes[0].toString()).toBe('frac{6/4}');
      expect(st1[0]?.resultNode.toString()).toBe('frac{3/2}');

      const st2 = math.solveNextStep().changes;

      expect(step.changes.length).toBe(3);
      expect(st2[0]?.inputNodes?.length).toBe(1)
      expect(st2[0]?.inputNodes[0]?.toString()).toBe('frac{3/2}');
      expect(st2[0]?.resultNode.toString()).toBe('frac{2/3}');
      expect(st2[0]?.operator).toBe('div');

      expect(st2[1]?.inputNodes.length).toBe(1);
      expect(st2[1]?.inputNodes[0]?.type).toBe('div');
      expect(st2[1]?.resultNode?.type).toBe('mul');

      expect(st2[2]?.inputNodes[0].toString()).toBe('frac{1/2}');
      expect(st2[2]?.inputNodes[1].toString()).toBe('frac{2/3}');
      expect(st2[2]?.resultNode.toString()).toBe('frac{2/6}');

      const st3 = math.solveNextStep().changes;
      expect(st3[0]?.changeRule.name).toBe('SimplifyFractions');
      expect(st3[0]?.inputNodes[0].toString()).toBe('frac{2/6}');
      expect(st3[0]?.resultNode.toString()).toBe('frac{1/3}');

      expect(step.tree.left.value?.value().toString()).toBe('frac{1/3}');
    });

    it("Should sum 1/2 + 1/4", ()=>{
      const math = new MathEngine('frac{1/2} + frac{1/4}');

      const step = math.solveNextStep();
      const st0 = step.changes;
      expect(st0.length).toBe(2);
      expect(st0[0]?.inputNodes[0]?.toString()).toBe('frac{1/2}');
      expect(st0[0]?.resultNode?.toString()).toBe('frac{2/4}');
      expect(st0[0]?.operator).toBe('expand');
      expect(st0[1]?.inputNodes[0]?.toString()).toBe('frac{2/4}');
      expect(st0[1]?.inputNodes[1]?.toString()).toBe('frac{1/4}');
      expect(st0[1]?.resultNode?.toString()).toBe('frac{3/4}');
      expect(st0[1]?.operator).toBe('add');

      expect(step.tree.left.value?.value().toString()).toBe('frac{3/4}');
    });

    it("Should sum 1/2 + 1/4 - 1/6 + (1/5 + 3/2)", ()=>{
      const math = new MathEngine('frac{1/2} + frac{1/4} - frac{1/6} + (frac{1/5} + frac{3/2})');

      const step = math.solveNextStep();
      const st0 = step.changes;
      expect(st0.length).toBe(2);
      expect(st0[0]?.inputNodes?.length).toBe(2);
      expect(st0[0]?.inputNodes[0]?.toString()).toBe('frac{1/5}');
      expect(st0[0]?.inputNodes[1]?.toString()).toBe('frac{3/2}');
      expect(st0[0]?.operator).toBe('expand');

      expect(st0[1]?.inputNodes[0]?.toString()).toBe('frac{2/10}');
      expect(st0[1]?.inputNodes[1]?.toString()).toBe('frac{15/10}');
      expect(st0[1]?.resultNode?.toString()).toBe('frac{17/10}');
      expect(st0[1]?.operator).toBe('add');

      const st1 = math.solveNextStep().changes;
      expect(st1.length).toBe(2);
      expect(st1[0]?.inputNodes?.length).toBe(4);
      expect(st1[0]?.inputNodes[0]?.toString()).toBe('frac{1/2}');
      expect(st1[0]?.inputNodes[1]?.toString()).toBe('frac{1/4}');
      expect(st1[0]?.inputNodes[2]?.toString()).toBe('frac{1/6}');
      expect(st1[0]?.inputNodes[3]?.toString()).toBe('frac{17/10}');
      expect(st1[0]?.operator).toBe('expand');

      expect(st1[1]?.inputNodes[0]?.toString()).toBe('frac{30/60}');
      expect(st1[1]?.inputNodes[1]?.toString()).toBe('frac{15/60}');
      expect(st1[1]?.resultNode?.toString()).toBe('frac{45/60}');
      expect(st1[1]?.operator).toBe('add');

      const st2 = math.solveNextStep().changes;
      expect(st2.length).toBe(2);
      expect(st2[0]?.inputNodes?.length).toBe(2);
      expect(st2[0]?.inputNodes[0]?.toString()).toBe('frac{45/60}');
      expect(st2[0]?.inputNodes[1]?.toString()).toBe('frac{10/60}');
      expect(st2[0]?.operator).toBe('sub');
      expect(st2[0]?.resultNode?.toString()).toBe('frac{35/60}');

      expect(st2[1].inputNodes?.length).toBe(2);
      expect(st2[1]?.inputNodes[0]?.toString()).toBe('frac{35/60}');
      expect(st2[1]?.inputNodes[1]?.toString()).toBe('frac{102/60}');
      expect(st2[1]?.operator).toBe('add');

      expect(st2[1]?.resultNode?.toString()).toBe('frac{137/60}');

      // should not reduce further
      const step4 = math.solveNextStep();
      expect(step4.changes.length).toBe(0);

      expect(step.tree.left.value?.value().toString()).toBe('frac{137/60}');
    });
  });
});
