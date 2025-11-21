
import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ScanItem } from '../types';
import { ScanService } from '../services/scanService';

const CONCURRENCY_LIMIT = 2;

export const useProcessingQueue = () => {
  const [items, setItems] = useState<ScanItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  // --- Item Management ---

  const addFiles = useCallback((files: File[]) => {
    const newItems: ScanItem[] = files.map(file => ({
      id: uuidv4(),
      file,
      originalUrl: URL.createObjectURL(file),
      name: file.name,
      status: 'idle'
    }));
    setItems(prev => [...prev, ...newItems]);
  }, []);

  const addGeneratedItem = useCallback((url: string) => {
    const newItem: ScanItem = {
      id: uuidv4(),
      originalUrl: url,
      name: `AI_Sample_${Date.now().toString().slice(-4)}.png`,
      status: 'idle'
    };
    setItems(prev => [...prev, newItem]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const resetAll = useCallback(() => {
    setItems([]);
    setHasStarted(false);
    setIsProcessing(false);
  }, []);

  // --- Queue Processing Logic ---

  const processItem = async (id: string) => {
    // Update status to detecting
    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'detecting' } : i));
    
    let currentItem: ScanItem | undefined = items.find(i => i.id === id);
    // Need to get fresh state inside async? 
    // Actually, better to trust the ID and input parameters, but we need the URL.
    // We'll use a functional update for `setItems` but we need the URL first.
    // To resolve this safely, we can pass the URL into this function or read from a ref, 
    // but reading from current state snapshot `items` (from closure) might be stale if items changed rapidly.
    // However, `items` in `processQueue` (the caller) is fresh when the queue starts.
    
    // Let's find the URL from the functional update to ensure we have the object
    // But we can't await inside setState.
    // So we rely on the fact that `originalUrl` doesn't change once added.
    const itemToProcess = items.find(i => i.id === id);
    if (!itemToProcess) return;

    try {
      // Step 1: Get Meta (Simulate getting image ID/upload)
      const metaRes = await ScanService.getImageMeta(itemToProcess.originalUrl);
      const { width, height } = metaRes.data;

      // Step 2: Detect
      const detectRes = await ScanService.detectBoundary(itemToProcess.originalUrl, width, height);
      const boundingBox = detectRes.data;

      // Update state to 'cropping' (optional visual step, or just go straight to processed)
      setItems(prev => prev.map(i => i.id === id ? { ...i, width, height, boundingBox, status: 'cropping' } : i));

      // Step 3: Crop
      const cropRes = await ScanService.cropImage(itemToProcess.originalUrl, boundingBox);
      const croppedUrl = cropRes.data;

      // Finish
      setItems(prev => prev.map(i => 
        i.id === id ? { ...i, croppedUrl, status: 'cropped' } : i
      ));

    } catch (error: any) {
      console.error(`Processing failed for ${id}`, error);
      setItems(prev => prev.map(i => 
        i.id === id ? { ...i, status: 'error', errorMessage: error.message || 'Unknown error' } : i
      ));
    }
  };

  // Recursive Queue Worker
  const processQueue = useCallback((queueIds: string[]) => {
    const queue = [...queueIds];
    let activeWorkers = 0;

    const work = async () => {
      // If queue empty and no workers, we are done
      if (queue.length === 0 && activeWorkers === 0) {
        setIsProcessing(false);
        return;
      }

      // If nothing left to pick up
      if (queue.length === 0) return;

      // Spawn workers up to limit
      while (queue.length > 0 && activeWorkers < CONCURRENCY_LIMIT) {
        const id = queue.shift();
        if (!id) continue;

        activeWorkers++;
        
        // Process, then release worker and recurse
        processItem(id).finally(() => {
          activeWorkers--;
          work();
        });
      }
    };

    work();
  }, [items]); // Dependencies need to be careful here. `processItem` closes over `items`.

  // We need to make sure `processItem` has access to the latest `items` or passes data correctly.
  // Since `processItem` is defined INSIDE the hook, it sees `items`. 
  // BUT, if `processQueue` is called, it captures the scope.
  // Refactoring `processItem` to accept the URL directly avoids the closure staleness issue for immutable properties.
  
  // Re-implementing processItem to be robust against closures:
  // Actually, since `processQueue` is triggered once, the `items` in closure is the state AT TRIGGER time.
  // This is usually fine for `originalUrl` which doesn't change.
  
  const startProcessing = useCallback(() => {
    const idleItems = items.filter(i => i.status === 'idle');
    if (idleItems.length === 0) return;

    setHasStarted(true);
    setIsProcessing(true);

    // Pass necessary data to the queue processor so it doesn't depend on stale state for readonly data
    const queueIds = idleItems.map(i => i.id);
    
    // We use a ref-like pattern for the queue runner or just pass IDs and let `processItem` find via functional state updates?
    // `processItem` above reads `items.find`. If `items` changes (e.g. user deletes an item while processing), `itemToProcess` might be undefined.
    // We added a check `if (!itemToProcess) return;` which handles safety.
    
    processQueue(queueIds);
  }, [items, processQueue]);

  return {
    items,
    isProcessing,
    hasStarted,
    addFiles,
    addGeneratedItem,
    removeItem,
    startProcessing,
    resetAll
  };
};
