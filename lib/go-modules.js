const graphlib = require('graphlib');
const subProcess = require('./sub-process');
// const _ = require('lodash');

module.exports = {
  getDepTree: getDepTree,
};

const cache = {};

function getDepTree(cwd) {
  return subProcess.execute(
    'go',
    ['mod', 'graph'],
    {cwd}
  ).then((stdout) => {
    const graph = createGraphFromGoModGraph(stdout);
    const root = graph.sources().pop();

    return createTreeFromGraph(root, graph);
  });
}

function createGraphFromGoModGraph(goModGraphOutput) {
  const graph = new graphlib.Graph();
  for (const line of goModGraphOutput.trim().split('\n')) {
    const [from, to] = line.split(/\s/);
    graph.setNode(from, getGoModuleObject(from));
    graph.setNode(to, getGoModuleObject(to));
    graph.setEdge(from, to);
  }

  return graph;
}

function createTreeFromGraph(root, graph) {
  if (!cache[root]) {
    const nodeData = graph.node(root);
    const res = {
      name: nodeData.name,
      version: nodeData.version,
      dependencies: {},
    };
    for (const nodeName of graph.successors(root)) {
      const nodeData = graph.node(nodeName);
      const subTree = createTreeFromGraph(nodeName, graph);
      if (subTree) {
        res.dependencies[nodeData.name] = subTree;
        cache[nodeName] = subTree;
        // return cache[root];
      }
    }
    cache[root] = res;
    return cache[root];
  }
}

function getGoModuleObject(moduleId) {
  const [name, version] = moduleId.split('@');
  return {name, version};
}
