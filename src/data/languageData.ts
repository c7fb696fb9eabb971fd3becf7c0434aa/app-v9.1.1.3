import { ComponentCard } from '../types';

export interface ChronologyLayer {
  id: string;
  step: string;
  title: string;
  category: string;
  description: string;
  metrics: string;
}

export interface LanguagePageData {
  slug: string;
  name: string;
  tagline: string;
  version: string;
  cards: ComponentCard[];
  chronologyLayers: ChronologyLayer[];
}

export const PYTHON_DATA: LanguagePageData = {
  slug: 'python',
  name: 'Python',
  tagline: 'CPython Runtime Architecture & Concurrency Model',
  version: '3.13.0',
  cards: [
    {
      id: 'python-gc',
      title: 'Cyclic Garbage Collection & Ref Counting',
      tag: 'Memory Subsystem',
      definition: 'CPython manages object lifecycles primarily through reference counting supplemented by a 3-generation cyclic garbage collector to detect circular reference graphs.',
      keyRule: 'Every PyObject begins with ob_refcnt; circular references require gc.collect() generational sweeps.',
      deepDive: {
        typescriptInterface: `interface CPythonObjectRef {
  ob_refcnt: number;
  ob_type: string;
  gc_refs?: number;
  generation: 0 | 1 | 2;
  collect_cycles: () => number;
}`,
      },
    },
    {
      id: 'python-asyncio',
      title: 'Asyncio Event Loop & Coroutine Frames',
      tag: 'Async Runtime',
      definition: 'Cooperative asynchronous multitasking powered by generators and coroutines, scheduling task execution across an epoll/kqueue selector event loop without OS thread overhead.',
      keyRule: 'Never execute CPU-bound blocking operations inside the primary event loop thread.',
      deepDive: {
        typescriptInterface: `interface CoroutineTask<T = unknown> {
  task_id: number;
  coro: () => Promise<T>;
  state: 'PENDING' | 'RUNNING' | 'DONE';
  cancel: () => boolean;
}`,
      },
    },
    {
      id: 'python-nogil',
      title: 'Free-Threaded CPython (No-GIL Concurrency)',
      tag: 'Execution Engine',
      definition: 'PEP 703 removes the Global Interpreter Lock, enabling pure multi-core parallelism across standard threads via biased reference counting and mimalloc heap isolation.',
      keyRule: 'Free-threaded builds require thread-safe container operations or explicit synchronization primitives.',
      deepDive: {
        typescriptInterface: `interface FreeThreadRuntime {
  gil_enabled: false;
  active_threads: number;
  heap_allocator: 'mimalloc';
  lock_contention_ms: number;
}`,
      },
    },
    {
      id: 'python-jit',
      title: 'Tiered Copy-and-Patch JIT Compiler',
      tag: 'JIT Optimizer',
      definition: 'A low-latency tiered JIT that analyzes bytecode trace hotspots and stitches pre-compiled binary templates together for immediate execution with minimal warmup time.',
      keyRule: 'Specialized bytecode instructions (PEP 659) adapt dynamically to runtime operand types.',
      deepDive: {
        typescriptInterface: `interface JITExecutionTrace {
  bytecode_offset: number;
  execution_count: number;
  tier: 'INTERPRETER' | 'TIER1_TRACE' | 'TIER2_JIT';
  optimized_native_ptr: string;
}`,
      },
    },
  ],
  chronologyLayers: [
    {
      id: 'py-01',
      step: '01',
      title: 'PEG Lexer & Concrete Syntax Parsing',
      category: 'Front-End Parser',
      description: 'Source string is stream-tokenized and transformed into an Abstract Syntax Tree (AST) via Python’s pegen PEG parser.',
      metrics: 'AST Depth: ~14 nodes · Latency: 0.12ms',
    },
    {
      id: 'py-02',
      step: '02',
      title: 'Symbol Table & Scope Resolution',
      category: 'Semantic Analysis',
      description: 'Analyzes lexical variable closures, globals, and cell variables to optimize local LOAD_FAST opcode lookups.',
      metrics: 'Local Scope Resolution: O(1) Array Indexing',
    },
    {
      id: 'py-03',
      step: '03',
      title: 'Bytecode Emission & Optimization',
      category: 'Bytecode Compiler',
      description: 'Generates specialized opcode instructions and builds code objects with constant folding and peephole passes.',
      metrics: 'Opcode Sequence: 128 bytes · CodeObject Alloc',
    },
    {
      id: 'py-04',
      step: '04',
      title: 'CPython Evaluation Loop (ceval.c)',
      category: 'VM Interpreter',
      description: 'Pushes frame evaluation contexts to the value stack, dispatching opcodes via computed goto jump tables.',
      metrics: 'Dispatch Overhead: <2ns per instruction',
    },
    {
      id: 'py-05',
      step: '05',
      title: 'Adaptive Specializing Tier (PEP 659)',
      category: 'JIT Warmup',
      description: 'Observes type stability in hot loops and patches generic instructions into monomorphic specialized variants.',
      metrics: 'Specialization Rate: 84% monomorphic',
    },
    {
      id: 'py-06',
      step: '06',
      title: 'Cyclic Generational GC Sweep',
      category: 'Memory Collector',
      description: 'Tracks object allocations across Generation 0, 1, and 2, reclaiming unreferenced cyclic isolates.',
      metrics: 'Gen-0 Threshold: 700 allocs · Pause: 0.05ms',
    },
  ],
};

export const JAVA_DATA: LanguagePageData = {
  slug: 'java',
  name: 'Java',
  tagline: 'HotSpot JVM Architecture & Memory Subsystems',
  version: '21 LTS',
  cards: [
    {
      id: 'java-virtual-threads',
      title: 'Virtual Threads (Project Loom)',
      tag: 'Concurrency',
      definition: 'Lightweight user-mode threads managed by the JVM rather than the OS, allowing millions of concurrent tasks to execute across a small pool of carrier ForkJoin threads.',
      keyRule: 'Do not pool virtual threads; create them per-task as disposable concurrency units.',
      deepDive: {
        typescriptInterface: `interface VirtualThreadState {
  carrierThread: string;
  stackMounted: boolean;
  continuationState: 'YIELD' | 'RUNNING' | 'DONE';
  parkCount: number;
}`,
      },
    },
    {
      id: 'java-zgc',
      title: 'ZGC (Generational Low-Latency GC)',
      tag: 'Garbage Collection',
      definition: 'A concurrent, scalable garbage collector that performs all heavy collection work concurrently with application threads, keeping maximum pause times strictly under 1 millisecond.',
      keyRule: 'Load barriers inspect colored pointers to resolve object relocations without thread stopping.',
      deepDive: {
        typescriptInterface: `interface ZGCCollectorMetrics {
  maxPauseMs: 0.8;
  coloredPointers: true;
  heapSizeGB: 32;
  concurrentMarking: boolean;
}`,
      },
    },
    {
      id: 'java-tiered-jit',
      title: 'HotSpot Tiered JIT Compilation',
      tag: 'Compiler Pipeline',
      definition: 'Tiered execution combining the C1 client compiler for instant warmup profiling with the C2 server compiler for aggressive inlining, loop unrolling, and vectorization.',
      keyRule: 'Methods must cross invocation and backedge counter thresholds to trigger C2 recompilation.',
      deepDive: {
        typescriptInterface: `interface HotspotCompilationTier {
  method: string;
  tier: 1 | 2 | 3 | 4;
  inlinedCallSites: number;
  osrTriggered: boolean;
}`,
      },
    },
    {
      id: 'java-foreign-memory',
      title: 'Foreign Function & Memory API (Panama)',
      tag: 'Native Interop',
      definition: 'Type-safe, memory-safe access to off-heap native memory segments and native C functions without fragile JNI wrappers or dangerous sun.misc.Unsafe hacks.',
      keyRule: 'MemorySegment arenas enforce strict deterministic lifecycle and temporal safety.',
      deepDive: {
        typescriptInterface: `interface NativeMemoryArena {
  byteSize: number;
  scope: 'CONFINED' | 'SHARED' | 'GLOBAL';
  isAlive: boolean;
  allocateSegment: (size: number) => ArrayBuffer;
}`,
      },
    },
  ],
  chronologyLayers: [
    {
      id: 'jv-01',
      step: '01',
      title: 'Javac Compilation to JVM Bytecode',
      category: 'Static Compiler',
      description: 'Java source syntax is parsed, validated, and translated into standardized .class binary bytecode.',
      metrics: 'Class File Format: v65.0 (Java 21 LTS)',
    },
    {
      id: 'jv-02',
      step: '02',
      title: 'ClassLoader Hierarchy & Bytecode Verification',
      category: 'Security Verifier',
      description: 'Loads bytecode through Bootstrap, Platform, and App ClassLoaders while proving type safety and stack limits.',
      metrics: 'Verification Passes: 4 passes · StackMap table',
    },
    {
      id: 'jv-03',
      step: '03',
      title: 'HotSpot Interpreter Execution',
      category: 'Interpreter Tier 0',
      description: 'Interprets bytecode opcodes with live method invocation counters to identify hot application loops.',
      metrics: 'Counter Threshold: 2000 invocations',
    },
    {
      id: 'jv-04',
      step: '04',
      title: 'C1 JIT Tier 1-3 Profiling Compilation',
      category: 'Client Compiler',
      description: 'Compiles method bytecode into native machine code with lightweight profiling instructions injected.',
      metrics: 'Compile Time: <5ms · Native Code Size: ~1.8KB',
    },
    {
      id: 'jv-05',
      step: '05',
      title: 'C2 JIT Server Optimization & Inlining',
      category: 'Server Compiler Tier 4',
      description: 'Performs aggressive global escape analysis, dead code elimination, and SIMD autovectorization.',
      metrics: 'Peak Throughput: ~98% of hand-tuned C++',
    },
    {
      id: 'jv-06',
      step: '06',
      title: 'Generational ZGC Phase Relocation',
      category: 'Concurrent GC',
      description: 'Relocates memory pages concurrently using colored pointers and load barriers with sub-millisecond pauses.',
      metrics: 'Max Stop-The-World: 0.4ms across 16GB Heap',
    },
  ],
};

export const NODEJS_DATA: LanguagePageData = {
  slug: 'nodejs',
  name: 'Node.js',
  tagline: 'V8 JIT Engine & Libuv Event Loop Architecture',
  version: '22.x LTS',
  cards: [
    {
      id: 'node-libuv-loop',
      title: 'Libuv Multi-Platform Event Loop',
      tag: 'Event Driven Core',
      definition: 'The heartbeat of Node.js processing asynchronous non-blocking I/O through phased stages: timers, pending callbacks, idle/prepare, poll, check (setImmediate), and close.',
      keyRule: 'Microtasks (process.nextTick & Promise callbacks) drain immediately between each event loop phase.',
      deepDive: {
        typescriptInterface: `interface LibuvEventLoop {
  phase: 'TIMERS' | 'POLL' | 'CHECK' | 'CLOSE';
  activeHandles: number;
  pendingMicrotasks: number;
  epollWaitMs: number;
}`,
      },
    },
    {
      id: 'node-v8-turbofan',
      title: 'V8 Ignition & TurboFan Pipeline',
      tag: 'JavaScript Engine',
      definition: 'V8 converts JavaScript source directly to bytecode via the Ignition interpreter, while TurboFan compiles recurring function profiles into optimized machine code.',
      keyRule: 'Keep object shapes consistent; hidden class polymorphism triggers TurboFan deoptimization.',
      deepDive: {
        typescriptInterface: `interface V8OptimizationStatus {
  functionName: string;
  isOptimized: boolean;
  hiddenClassMap: string;
  deoptReason?: 'WRONG_FEEDBACK_TYPE' | 'OUT_OF_BOUNDS';
}`,
      },
    },
    {
      id: 'node-worker-threads',
      title: 'Worker Threads & Shared Memory',
      tag: 'Parallelism',
      definition: 'Isolate-based real multi-threading in Node.js where threads communicate via MessagePort channels or zero-copy high-performance SharedArrayBuffer atomics.',
      keyRule: 'Use Atomics.wait and Atomics.notify for deterministic coordination across shared memory segments.',
      deepDive: {
        typescriptInterface: `interface WorkerChannel {
  threadId: number;
  postMessage: (msg: unknown) => void;
  sharedMemory: SharedArrayBuffer;
  terminate: () => Promise<number>;
}`,
      },
    },
    {
      id: 'node-streams-backpressure',
      title: 'Streams Architecture & Backpressure Flow',
      tag: 'Data Pipeline',
      definition: 'Composable pipelines for reading and writing large chunks of data sequentially with automatic backpressure signals to prevent RAM exhaustion.',
      keyRule: 'When write() returns false, wait for the drain event before pushing additional buffer chunks.',
      deepDive: {
        typescriptInterface: `interface NodeStreamFlow {
  highWaterMark: number; // default 16KB
  bufferQueueSize: number;
  isPaused: boolean;
  pipe: <T>(dest: T) => T;
}`,
      },
    },
  ],
  chronologyLayers: [
    {
      id: 'nd-01',
      step: '01',
      title: 'V8 Streaming Lexer & AST Generation',
      category: 'V8 Front-End',
      description: 'Parses ES module scripts concurrently on background threads, constructing high-level Abstract Syntax Trees.',
      metrics: 'Parse Velocity: ~850KB/sec background thread',
    },
    {
      id: 'nd-02',
      step: '02',
      title: 'Ignition Bytecode Emission & Feedback',
      category: 'V8 Interpreter',
      description: 'Generates concise register-based bytecode and collects type feedback vectors at call sites.',
      metrics: 'Memory Footprint: <35% of raw AST memory',
    },
    {
      id: 'nd-03',
      step: '03',
      title: 'Libuv Epoll / Kqueue I/O Polling',
      category: 'OS Async Subsystem',
      description: 'Kernel multiplexer queries network sockets and file descriptors, waking the event loop on activity.',
      metrics: 'Kernel Call: epoll_wait(2) / kevent(2) zero-timeout',
    },
    {
      id: 'nd-04',
      step: '04',
      title: 'Microtask Queue Drain (process.nextTick)',
      category: 'Event Loop Transition',
      description: 'Executes process.nextTick() microtasks immediately followed by Promise resolution callbacks.',
      metrics: 'Queue Drain Latency: <0.02ms immediate flush',
    },
    {
      id: 'nd-05',
      step: '05',
      title: 'TurboFan JIT Sea-of-Nodes Optimization',
      category: 'V8 JIT Compiler',
      description: 'Builds SSA intermediate representation graphs and compiles type-stabilized functions to machine instructions.',
      metrics: 'JIT Optimization Gain: 8x-14x speedup',
    },
    {
      id: 'nd-06',
      step: '06',
      title: 'Libuv Worker Thread Pool Offloading',
      category: 'Thread Pool Manager',
      description: 'Offloads blocking system calls (DNS, fs, crypto) to the 4 default libuv background worker threads.',
      metrics: 'Pool Concurrency: UV_THREADPOOL_SIZE=4 threads',
    },
  ],
};
