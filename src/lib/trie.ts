class TrieNode {
  children: Map<string, TrieNode | null>;

  constructor() {
    this.children = new Map();
  }
}

class Trie {
  root: TrieNode;
  
  constructor() {
    this.root = new TrieNode();
  }
  // O(K+1)
  insert(word: string) {
    let currentNode = this.root;
    const chars = word.split('');

    for (const char of chars) {
      const childNode = currentNode.children.get(char);

      if (childNode) {
        currentNode = childNode;
      } else {
        const newNode = new TrieNode();
        currentNode.children.set(char, newNode);
        currentNode = newNode;
      }
    }

    currentNode.children.set('*', null);
  }
  // O(K)
  search(word: string) {
    let currentNode = this.root;
    const chars = word.split('');

    for (const char of chars) {
      const childNode = currentNode.children.get(char);

      if (childNode) {
        currentNode = childNode;
      } else {
        return null;
      }
    }

    return currentNode;
  }
  collectAllWords(node: TrieNode | null, word = '', words: string[] = []) {
    const currentNode = node || this.root;

    currentNode.children.forEach((value: TrieNode | null, key: string) => {
      // value is node
      if (key === '*') {
        words.push(word);
      } else {
        this.collectAllWords(value, word + key, words);
      }
    });

    return words;
  }
  autocomplete(prefix: string) {
    const currentNode = this.search(prefix);

    if (!currentNode) {
      return null;
    }

    return this.collectAllWords(currentNode);
  }
}

export default Trie;