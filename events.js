// The Krew Event Definitions
// Standardized event types for Robo ↔ Afro communication

module.exports = {
    // ============================================
    // SYSTEM EVENTS
    // ============================================
    
    // Agent connection status
    AFRO_ONLINE: 'afro_online',
    AFRO_OFFLINE: 'afro_offline',
    AFRO_HEARTBEAT: 'afro_heartbeat',
    
    ROBO_ONLINE: 'robo_online',
    ROBO_OFFLINE: 'robo_offline',
    ROBO_HEARTBEAT: 'robo_heartbeat',
    
    // System health
    HEALTH_CHECK: 'health_check',
    SYSTEM_STATUS: 'system_status',
    SYSTEM_ALERT: 'system_alert',
    
    // ============================================
    // TASK EVENTS
    // ============================================
    
    // Task lifecycle
    TASK_CREATE: 'task_create',
    TASK_ASSIGN: 'task_assign',
    TASK_START: 'task_start',
    TASK_UPDATE: 'task_update',
    TASK_COMPLETE: 'task_complete',
    TASK_FAILED: 'task_failed',
    TASK_CANCEL: 'task_cancel',
    
    // Task requests
    TASK_REQUEST: 'task_request',      // Request help with something
    TASK_QUERY: 'task_query',          // Ask about task status
    TASK_LIST: 'task_list',            // Request all tasks
    
    // ============================================
    // ALERT EVENTS
    // ============================================
    
    ALERT: 'alert',
    ALERT_CRITICAL: 'alert_critical',  // Server down, crash, etc.
    ALERT_WARNING: 'alert_warning',    // Disk space low, high load
    ALERT_INFO: 'alert_info',          // General notifications
    
    // ============================================
    // WORK OUTPUT EVENTS (Afro)
    // ============================================
    
    // Creative outputs
    BEAT_COMPLETE: 'beat_complete',
    VIDEO_UPLOADED: 'video_uploaded',
    COMIC_PAGE_DONE: 'comic_page_done',
    SCRIPT_COMPLETE: 'script_complete',
    MIX_EXPORTED: 'mix_exported',
    
    // ============================================
    // TRADING EVENTS (Afro)
    // ============================================
    
    TRADE_PLACED: 'trade_placed',
    TRADE_CLOSED: 'trade_closed',
    TRADE_UPDATE: 'trade_update',
    BET_PLACED: 'bet_placed',
    BET_RESULT: 'bet_result',
    
    // Market updates
    MARKET_ALERT: 'market_alert',
    PRICE_TARGET_HIT: 'price_target_hit',
    
    // ============================================
    // INFRASTRUCTURE EVENTS (Robo)
    // ============================================
    
    DOMAIN_ALERT: 'domain_alert',           // Domain issues
    SERVER_ALERT: 'server_alert',           // Server down/high load
    BACKUP_COMPLETE: 'backup_complete',
    DEPLOYMENT_DONE: 'deployment_done',
    
    // DNS/SSL issues
    SSL_EXPIRING: 'ssl_expiring',
    DNS_ISSUE: 'dns_issue',
    
    // ============================================
    // COMMUNICATION EVENTS
    // ============================================
    
    MESSAGE: 'message',              // Direct message
    TYPING: 'typing',                // Agent is typing
    PING: 'ping',                    // Keepalive
    PONG: 'pong',                    // Keepalive response
    
    // ============================================
    // DATA SYNC EVENTS
    // ============================================
    
    SYNC_REQUEST: 'sync_request',
    SYNC_COMPLETE: 'sync_complete',
    DATA_UPDATE: 'data_update',
    
    // ============================================
    // COORDINATION EVENTS
    // ============================================
    
    STATUS_UPDATE: 'status_update',       // General status update
    CAPACITY_CHECK: 'capacity_check',     // "Can you handle X?"
    HANDOFF: 'handoff',                   // Pass task to other agent
    
    // ============================================
    // IDENTIFICATION
    // ============================================
    
    IDENTIFY: 'identify',            // Client identifies itself
    WELCOME: 'welcome',              // Server welcomes client
};

// Event descriptions for documentation
module.exports.DESCRIPTIONS = {
    AFRO_ONLINE: 'Afro connected to the hub',
    AFRO_OFFLINE: 'Afro disconnected',
    AFRO_HEARTBEAT: 'Afro is alive (every 5 min)',
    ROBO_ONLINE: 'Robo server started',
    ROBO_OFFLINE: 'Robo server shutting down',
    ROBO_HEARTBEAT: 'Robo is alive (every 5 min)',
    TASK_COMPLETE: 'Task finished successfully',
    TASK_REQUEST: 'Request for assistance',
    ALERT_CRITICAL: 'Critical system issue',
    BEAT_COMPLETE: 'New beat/track finished',
    TRADE_PLACED: 'Trade/bet executed',
    DOMAIN_ALERT: 'Domain/website issue',
    MESSAGE: 'Direct text message',
};

// Event categories
module.exports.CATEGORIES = {
    SYSTEM: ['AFRO_ONLINE', 'AFRO_OFFLINE', 'AFRO_HEARTBEAT', 'ROBO_ONLINE', 'ROBO_OFFLINE', 'ROBO_HEARTBEAT', 'HEALTH_CHECK'],
    TASKS: ['TASK_CREATE', 'TASK_ASSIGN', 'TASK_START', 'TASK_UPDATE', 'TASK_COMPLETE', 'TASK_FAILED', 'TASK_REQUEST'],
    ALERTS: ['ALERT', 'ALERT_CRITICAL', 'ALERT_WARNING', 'ALERT_INFO'],
    CREATIVE: ['BEAT_COMPLETE', 'VIDEO_UPLOADED', 'COMIC_PAGE_DONE', 'SCRIPT_COMPLETE', 'MIX_EXPORTED'],
    TRADING: ['TRADE_PLACED', 'TRADE_CLOSED', 'TRADE_UPDATE', 'BET_PLACED', 'BET_RESULT'],
    INFRASTRUCTURE: ['DOMAIN_ALERT', 'SERVER_ALERT', 'BACKUP_COMPLETE', 'DEPLOYMENT_DONE', 'SSL_EXPIRING', 'DNS_ISSUE'],
};
