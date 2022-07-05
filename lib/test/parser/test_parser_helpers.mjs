
// retrieves the childnode frm root from childrens chain
// root should be a SyntaxTreeNode
export function rch(root,ch1Cnt,ch2Cnt,ch3Cnt,ch4Cnt,ch5Cnt,ch6Cnt,ch7Cnt,ch8Cnt,ch9Cnt,ch10Cnt){
  let node = root;
  for (let i = 1; i < arguments.length; ++i) {
    node = node?.children[arguments[i]];
  }
  return node;
}