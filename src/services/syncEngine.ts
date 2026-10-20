/**
 * Local Real-time Peer-to-Peer / Multi-tab Sync Engine
 * Uses Web BroadcastChannel and Storage events to allow instant remote control
 * without any cloud server or email account requirement.
 */

import { RemoteCommand, TimeRequest } from '../types';

type CommandListener = (command: RemoteCommand) => void;
type RequestListener = (request: TimeRequest) => void;

class HavenSyncEngine {
  private channel: BroadcastChannel | null = null;
  private commandListeners: Set<CommandListener> = new Set();
  private requestListeners: Set<RequestListener> = new Set();
  private channelName = 'havenscreen_p2p_channel';

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(this.channelName);
        this.channel.onmessage = (event: MessageEvent) => {
          this.handleIncoming(event.data);
        };
      } catch (e) {
        console.warn('BroadcastChannel error, falling back to storage events', e);
      }
    }

    // Storage event fallback for cross-tab sync
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e: StorageEvent) => {
        if (e.key === 'havenscreen_sync_event' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.handleIncoming(data);
          } catch (err) {
            console.error('Failed to parse sync event', err);
          }
        }
      });
    }
  }

  private handleIncoming(data: any) {
    if (!data) return;
    if (data.type === 'TIME_REQUEST') {
      this.requestListeners.forEach(listener => listener(data.request));
    } else if (data.command) {
      this.commandListeners.forEach(listener => listener(data.command));
    }
  }

  /**
   * Broadcast a remote command from Parent to Child or vice-versa
   */
  public sendCommand(type: RemoteCommand['type'], payload?: any): RemoteCommand {
    const command: RemoteCommand = {
      id: 'cmd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type,
      payload,
      timestamp: Date.now(),
    };

    // Broadcast via BroadcastChannel
    if (this.channel) {
      this.channel.postMessage({ command });
    }

    // Also trigger storage event for backup cross-tab
    try {
      localStorage.setItem('havenscreen_sync_event', JSON.stringify({
        command,
        _rnd: Math.random(),
      }));
    } catch (e) {
      // ignore
    }

    // Trigger local listeners in same tab
    this.commandListeners.forEach(listener => listener(command));

    return command;
  }

  /**
   * Child sends time extension request to parent
   */
  public sendTimeRequest(request: TimeRequest): void {
    if (this.channel) {
      this.channel.postMessage({ type: 'TIME_REQUEST', request });
    }
    try {
      localStorage.setItem('havenscreen_sync_event', JSON.stringify({
        type: 'TIME_REQUEST',
        request,
        _rnd: Math.random(),
      }));

      // Store in pending requests list
      const existingStr = localStorage.getItem('havenscreen_pending_requests');
      const list: TimeRequest[] = existingStr ? JSON.parse(existingStr) : [];
      list.unshift(request);
      localStorage.setItem('havenscreen_pending_requests', JSON.stringify(list.slice(0, 10)));
    } catch (e) {
      // ignore
    }
    this.requestListeners.forEach(listener => listener(request));
  }

  /**
   * Parent approves or declines a time request
   */
  public resolveTimeRequest(requestId: string, status: 'approved' | 'rejected', note?: string): void {
    try {
      const existingStr = localStorage.getItem('havenscreen_pending_requests');
      let list: TimeRequest[] = existingStr ? JSON.parse(existingStr) : [];
      list = list.map(req => {
        if (req.id === requestId) {
          return { ...req, status, parentResponseNote: note };
        }
        return req;
      });
      localStorage.setItem('havenscreen_pending_requests', JSON.stringify(list));
    } catch (e) {
      // ignore
    }

    this.sendCommand('RESOLVE_REQUEST', { requestId, status, note });
  }

  public getPendingRequests(): TimeRequest[] {
    try {
      const existingStr = localStorage.getItem('havenscreen_pending_requests');
      if (existingStr) {
        return JSON.parse(existingStr);
      }
    } catch (e) {
      // ignore
    }
    return [];
  }

  public onCommand(listener: CommandListener): () => void {
    this.commandListeners.add(listener);
    return () => {
      this.commandListeners.delete(listener);
    };
  }

  public onRequest(listener: RequestListener): () => void {
    this.requestListeners.add(listener);
    return () => {
      this.requestListeners.delete(listener);
    };
  }
}

export const syncEngine = new HavenSyncEngine();
