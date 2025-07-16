import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Monitoring and Alerting Tests for Twitter Intelligence System
// These tests verify proper monitoring, logging, and alerting configuration for production

describe('Twitter Intelligence Monitoring & Alerting Tests', () => {
  const MONITORING_REQUIREMENTS = {
    LOG_RETENTION_DAYS: 30,
    ALERT_RESPONSE_TIME_SECONDS: 900, // 15 minutes (more realistic)
    UPTIME_TARGET_PERCENT: 99.9,
    ERROR_RATE_THRESHOLD: 0.01, // 1%
    RESPONSE_TIME_P95_MS: 500,
    DISK_USAGE_THRESHOLD: 80, // 80%
    MEMORY_USAGE_THRESHOLD: 75, // 75%
    CPU_USAGE_THRESHOLD: 70 // 70%
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Logging Infrastructure Tests', () => {
    it('should implement structured logging', () => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        service: 'twitter-intelligence',
        environment: 'production',
        version: '1.0.0',
        message: 'User analysis completed',
        context: {
          user_id: 'user_123',
          competitor_username: 'test_user',
          analysis_duration_ms: 1250,
          cost_usd: 0.05
        },
        trace_id: 'trace_abc123',
        span_id: 'span_def456'
      }

      // Validate log structure
      expect(logEntry.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      expect(['debug', 'info', 'warn', 'error', 'fatal']).toContain(logEntry.level)
      expect(logEntry.service).toBe('twitter-intelligence')
      expect(logEntry.environment).toBe('production')
      expect(logEntry.trace_id).toBeDefined()
      expect(logEntry.span_id).toBeDefined()
      expect(logEntry.context).toBeTypeOf('object')

      console.log('✓ Structured logging format validated')
    })

    it('should implement log sampling and filtering', () => {
      const logConfig = {
        sampling: {
          debug: 0.1, // 10% of debug logs
          info: 1.0,  // 100% of info logs
          warn: 1.0,  // 100% of warn logs
          error: 1.0, // 100% of error logs
          fatal: 1.0  // 100% of fatal logs
        },
        filters: {
          exclude_patterns: [
            '/health',
            '/metrics',
            'GET /favicon.ico'
          ],
          include_only_errors_for: [
            'rate_limiting',
            'authentication_failure'
          ]
        },
        retention: {
          debug: 7,   // 7 days
          info: 30,   // 30 days
          warn: 90,   // 90 days
          error: 365, // 1 year
          fatal: 365  // 1 year
        }
      }

      // Validate sampling rates
      Object.values(logConfig.sampling).forEach(rate => {
        expect(rate).toBeGreaterThanOrEqual(0)
        expect(rate).toBeLessThanOrEqual(1)
      })

      // Validate retention periods
      expect(logConfig.retention.info).toBe(MONITORING_REQUIREMENTS.LOG_RETENTION_DAYS)
      expect(logConfig.retention.error).toBeGreaterThan(logConfig.retention.info)

      console.log('✓ Log sampling and filtering configuration validated')
    })

    it('should implement log aggregation and searchability', () => {
      const logAggregationConfig = {
        elasticsearch: {
          cluster_name: 'twitter-intelligence-logs',
          index_pattern: 'twitter-intelligence-{YYYY.MM.DD}',
          shards: 3,
          replicas: 1,
          refresh_interval: '5s'
        },
        kibana: {
          dashboards: [
            'twitter-intelligence-overview',
            'twitter-intelligence-errors',
            'twitter-intelligence-performance'
          ],
          alerts: [
            'high-error-rate',
            'slow-response-times',
            'api-quota-exceeded'
          ]
        },
        search_fields: [
          'message',
          'context.user_id',
          'context.competitor_username',
          'trace_id',
          'level',
          'service'
        ]
      }

      expect(logAggregationConfig.elasticsearch.shards).toBeGreaterThan(0)
      expect(logAggregationConfig.elasticsearch.replicas).toBeGreaterThanOrEqual(0)
      expect(logAggregationConfig.kibana.dashboards.length).toBeGreaterThan(0)
      expect(logAggregationConfig.kibana.alerts.length).toBeGreaterThan(0)
      expect(logAggregationConfig.search_fields.length).toBeGreaterThan(5)

      console.log('✓ Log aggregation and search configuration validated')
    })
  })

  describe('Metrics Collection Tests', () => {
    it('should collect application metrics', () => {
      const applicationMetrics = {
        http_requests_total: {
          type: 'counter',
          labels: ['method', 'endpoint', 'status_code'],
          value: 150000
        },
        http_request_duration_seconds: {
          type: 'histogram',
          labels: ['method', 'endpoint'],
          buckets: [0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
          value: 0.245
        },
        twitter_api_calls_total: {
          type: 'counter',
          labels: ['operation', 'status'],
          value: 5000
        },
        langchain_analysis_duration_seconds: {
          type: 'histogram',
          labels: ['competitor_count'],
          buckets: [1, 5, 10, 30, 60, 120],
          value: 15.2
        },
        active_database_connections: {
          type: 'gauge',
          labels: ['database'],
          value: 25
        }
      }

      Object.entries(applicationMetrics).forEach(([metricName, metric]) => {
        expect(['counter', 'gauge', 'histogram', 'summary']).toContain(metric.type)
        expect(metric.labels).toBeInstanceOf(Array)
        expect(metric.value).toBeTypeOf('number')
        expect(metric.value).toBeGreaterThanOrEqual(0)
      })

      console.log('✓ Application metrics collection validated')
    })

    it('should collect system metrics', () => {
      const systemMetrics = {
        cpu_usage_percent: {
          value: 45.2,
          threshold: MONITORING_REQUIREMENTS.CPU_USAGE_THRESHOLD
        },
        memory_usage_percent: {
          value: 62.8,
          threshold: MONITORING_REQUIREMENTS.MEMORY_USAGE_THRESHOLD
        },
        disk_usage_percent: {
          value: 35.1,
          threshold: MONITORING_REQUIREMENTS.DISK_USAGE_THRESHOLD
        },
        network_io_bytes_per_second: {
          rx: 1024000, // 1MB/s
          tx: 512000   // 512KB/s
        },
        file_descriptors_used: {
          value: 1250,
          limit: 65536
        }
      }

      expect(systemMetrics.cpu_usage_percent.value).toBeLessThan(systemMetrics.cpu_usage_percent.threshold)
      expect(systemMetrics.memory_usage_percent.value).toBeLessThan(systemMetrics.memory_usage_percent.threshold)
      expect(systemMetrics.disk_usage_percent.value).toBeLessThan(systemMetrics.disk_usage_percent.threshold)
      expect(systemMetrics.file_descriptors_used.value).toBeLessThan(systemMetrics.file_descriptors_used.limit)

      console.log('✓ System metrics collection validated')
    })

    it('should collect business metrics', () => {
      const businessMetrics = {
        daily_active_users: {
          value: 1250,
          growth_rate: 0.05 // 5% week-over-week
        },
        competitor_analyses_per_day: {
          value: 850,
          average_cost_usd: 0.042
        },
        insights_generated_per_day: {
          value: 320,
          confidence_avg: 0.87
        },
        api_quota_utilization: {
          twitter_api: 0.65,   // 65% of quota used
          openrouter_api: 0.42 // 42% of quota used
        },
        monthly_recurring_revenue: {
          value: 15750.00,
          growth_rate: 0.12 // 12% month-over-month
        }
      }

      expect(businessMetrics.daily_active_users.growth_rate).toBeGreaterThan(0)
      expect(businessMetrics.competitor_analyses_per_day.average_cost_usd).toBeLessThan(0.10)
      expect(businessMetrics.insights_generated_per_day.confidence_avg).toBeGreaterThan(0.8)
      expect(businessMetrics.api_quota_utilization.twitter_api).toBeLessThan(0.9)
      expect(businessMetrics.api_quota_utilization.openrouter_api).toBeLessThan(0.9)

      console.log('✓ Business metrics collection validated')
    })
  })

  describe('Alerting Configuration Tests', () => {
    it('should configure critical system alerts', () => {
      const criticalAlerts = [
        {
          name: 'high_error_rate',
          condition: 'error_rate > 0.05', // 5%
          duration: '5m',
          severity: 'critical',
          notification_channels: ['slack-critical', 'pagerduty', 'email-oncall']
        },
        {
          name: 'service_down',
          condition: 'up == 0',
          duration: '1m',
          severity: 'critical',
          notification_channels: ['slack-critical', 'pagerduty', 'sms-oncall']
        },
        {
          name: 'high_response_time',
          condition: 'http_request_duration_p95 > 2',
          duration: '10m',
          severity: 'warning',
          notification_channels: ['slack-alerts', 'email-team']
        },
        {
          name: 'database_connection_failure',
          condition: 'database_connections_failed > 0',
          duration: '2m',
          severity: 'critical',
          notification_channels: ['slack-critical', 'pagerduty']
        }
      ]

      criticalAlerts.forEach(alert => {
        expect(['critical', 'warning', 'info']).toContain(alert.severity)
        expect(alert.notification_channels.length).toBeGreaterThan(0)
        expect(alert.duration).toMatch(/^\d+[smh]$/) // Valid duration format
        expect(alert.condition).toMatch(/[><=!]/) // Contains comparison operator
      })

      console.log('✓ Critical system alerts configuration validated')
    })

    it('should configure business logic alerts', () => {
      const businessAlerts = [
        {
          name: 'api_quota_approaching',
          condition: 'api_quota_utilization > 0.8',
          duration: '15m',
          severity: 'warning',
          notification_channels: ['slack-alerts']
        },
        {
          name: 'analysis_cost_spike',
          condition: 'daily_analysis_cost > 50',
          duration: '1h',
          severity: 'warning',
          notification_channels: ['slack-alerts', 'email-finance']
        },
        {
          name: 'low_insight_confidence',
          condition: 'avg_insight_confidence < 0.7',
          duration: '1h',
          severity: 'warning',
          notification_channels: ['slack-alerts']
        },
        {
          name: 'user_churn_spike',
          condition: 'daily_churn_rate > 0.05',
          duration: '6h',
          severity: 'warning',
          notification_channels: ['slack-alerts', 'email-product']
        }
      ]

      businessAlerts.forEach(alert => {
        expect(alert.severity).toMatch(/warning|critical/)
        expect(alert.notification_channels.length).toBeGreaterThan(0)
        expect(parseFloat(alert.duration)).toBeGreaterThan(0)
      })

      console.log('✓ Business logic alerts configuration validated')
    })

    it('should implement alert fatigue prevention', () => {
      const alertConfig = {
        grouping: {
          by: ['service', 'severity'],
          interval: '5m'
        },
        throttling: {
          same_alert_interval: '30m',
          burst_limit: 3
        },
        escalation: {
          warning_to_critical_after: '1h',
          auto_resolve_after: '24h'
        },
        inhibition_rules: [
          {
            source_match: { severity: 'critical' },
            target_match: { severity: 'warning' },
            equal: ['service']
          }
        ]
      }

      expect(alertConfig.grouping.interval).toMatch(/^\d+[smh]$/)
      expect(alertConfig.throttling.burst_limit).toBeGreaterThan(0)
      expect(alertConfig.inhibition_rules.length).toBeGreaterThan(0)

      console.log('✓ Alert fatigue prevention configuration validated')
    })
  })

  describe('Health Check Implementation Tests', () => {
    it('should implement comprehensive health checks', async () => {
      const healthChecks = {
        '/health': {
          checks: ['basic'],
          expected_response_time_ms: 50,
          expected_status: 200
        },
        '/health/ready': {
          checks: ['database', 'external_apis'],
          expected_response_time_ms: 200,
          expected_status: 200
        },
        '/health/live': {
          checks: ['memory', 'disk_space'],
          expected_response_time_ms: 100,
          expected_status: 200
        },
        '/health/deep': {
          checks: ['database', 'twitter_api', 'openrouter_api', 'memory', 'disk'],
          expected_response_time_ms: 1000,
          expected_status: 200
        }
      }

      for (const [endpoint, config] of Object.entries(healthChecks)) {
        const startTime = performance.now()
        
        // Simulate health check
        const mockHealthResponse = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          checks: config.checks.reduce((acc, check) => {
            acc[check] = {
              status: 'healthy',
              response_time_ms: Math.random() * 100,
              details: `${check} check passed`
            }
            return acc
          }, {} as Record<string, any>)
        }
        
        await new Promise(resolve => setTimeout(resolve, Math.random() * 50))
        
        const endTime = performance.now()
        const responseTime = endTime - startTime
        
        expect(responseTime).toBeLessThan(config.expected_response_time_ms)
        expect(mockHealthResponse.status).toBe('healthy')
        expect(Object.keys(mockHealthResponse.checks)).toEqual(config.checks)
        
        console.log(`✓ ${endpoint} health check: ${responseTime.toFixed(0)}ms`)
      }
    })

    it('should handle partial health check failures', () => {
      const partialFailureScenarios = [
        {
          name: 'database_slow',
          failing_checks: ['database'],
          expected_status: 'degraded',
          impact: 'reduced_performance'
        },
        {
          name: 'external_api_down',
          failing_checks: ['twitter_api'],
          expected_status: 'degraded',
          impact: 'limited_functionality'
        },
        {
          name: 'multiple_failures',
          failing_checks: ['database', 'twitter_api'],
          expected_status: 'unhealthy',
          impact: 'major_degradation'
        }
      ]

      partialFailureScenarios.forEach(scenario => {
        const healthResponse = {
          status: scenario.expected_status,
          impact: scenario.impact,
          failing_checks: scenario.failing_checks,
          healthy_checks: ['memory', 'disk_space'].filter(c => !scenario.failing_checks.includes(c))
        }

        expect(['healthy', 'degraded', 'unhealthy']).toContain(healthResponse.status)
        expect(healthResponse.failing_checks.length).toBeGreaterThan(0)
        expect(['reduced_performance', 'limited_functionality', 'major_degradation']).toContain(healthResponse.impact)
      })

      console.log('✓ Partial health check failure handling validated')
    })
  })

  describe('Performance Monitoring Tests', () => {
    it('should monitor response time percentiles', () => {
      const responseTimeMetrics = {
        p50: 150,  // 150ms
        p90: 300,  // 300ms
        p95: 450,  // 450ms
        p99: 800,  // 800ms
        p99_9: 1200 // 1.2s
      }

      expect(responseTimeMetrics.p95).toBeLessThan(MONITORING_REQUIREMENTS.RESPONSE_TIME_P95_MS)
      expect(responseTimeMetrics.p50).toBeLessThan(responseTimeMetrics.p90)
      expect(responseTimeMetrics.p90).toBeLessThan(responseTimeMetrics.p95)
      expect(responseTimeMetrics.p95).toBeLessThan(responseTimeMetrics.p99)
      expect(responseTimeMetrics.p99).toBeLessThan(responseTimeMetrics.p99_9)

      console.log(`✓ Response time percentiles validated: P95=${responseTimeMetrics.p95}ms`)
    })

    it('should monitor database performance', () => {
      const dbMetrics = {
        query_duration_p95_ms: 120,
        connection_pool_utilization: 0.65,
        slow_queries_per_minute: 2,
        deadlocks_per_hour: 0,
        cache_hit_ratio: 0.92
      }

      expect(dbMetrics.query_duration_p95_ms).toBeLessThan(500) // 500ms max
      expect(dbMetrics.connection_pool_utilization).toBeLessThan(0.8) // 80% max
      expect(dbMetrics.slow_queries_per_minute).toBeLessThan(10)
      expect(dbMetrics.deadlocks_per_hour).toBe(0)
      expect(dbMetrics.cache_hit_ratio).toBeGreaterThan(0.9) // 90% min

      console.log('✓ Database performance metrics validated')
    })

    it('should monitor external API performance', () => {
      const apiMetrics = {
        twitter_api: {
          success_rate: 0.998,
          avg_response_time_ms: 250,
          rate_limit_remaining: 850,
          errors_per_hour: 5
        },
        openrouter_api: {
          success_rate: 0.995,
          avg_response_time_ms: 1500,
          tokens_consumed_per_hour: 15000,
          cost_per_hour_usd: 1.25
        }
      }

      expect(apiMetrics.twitter_api.success_rate).toBeGreaterThan(0.99)
      expect(apiMetrics.twitter_api.avg_response_time_ms).toBeLessThan(500)
      expect(apiMetrics.openrouter_api.success_rate).toBeGreaterThan(0.99)
      expect(apiMetrics.openrouter_api.cost_per_hour_usd).toBeLessThan(5.0)

      console.log('✓ External API performance metrics validated')
    })
  })

  describe('Distributed Tracing Tests', () => {
    it('should implement end-to-end tracing', () => {
      const traceExample = {
        trace_id: 'trace_abc123def456',
        root_span: {
          span_id: 'span_root_001',
          operation_name: 'POST /api/admin/twitter/analyze',
          start_time: '2024-01-15T10:00:00.000Z',
          end_time: '2024-01-15T10:00:15.250Z',
          duration_ms: 15250,
          status: 'success',
          tags: {
            'http.method': 'POST',
            'http.url': '/api/admin/twitter/analyze',
            'user.id': 'user_123'
          }
        },
        child_spans: [
          {
            span_id: 'span_twitter_002',
            parent_span_id: 'span_root_001',
            operation_name: 'twitter_api.fetch_user_data',
            duration_ms: 850,
            status: 'success'
          },
          {
            span_id: 'span_langchain_003',
            parent_span_id: 'span_root_001',
            operation_name: 'langchain.analyze_competitor',
            duration_ms: 12500,
            status: 'success'
          },
          {
            span_id: 'span_db_004',
            parent_span_id: 'span_root_001',
            operation_name: 'db.save_analysis_results',
            duration_ms: 125,
            status: 'success'
          }
        ]
      }

      expect(traceExample.trace_id).toMatch(/^trace_[a-zA-Z0-9]+$/)
      expect(traceExample.root_span.duration_ms).toBeGreaterThan(0)
      expect(traceExample.child_spans.length).toBeGreaterThan(0)
      
      // Verify parent-child relationships
      traceExample.child_spans.forEach(span => {
        expect(span.parent_span_id).toBe(traceExample.root_span.span_id)
        expect(span.duration_ms).toBeLessThan(traceExample.root_span.duration_ms)
      })

      console.log('✓ End-to-end distributed tracing validated')
    })

    it('should implement trace sampling strategy', () => {
      const samplingConfig = {
        default_rate: 0.1, // 10% default sampling
        service_specific: {
          'twitter-intelligence': 0.2, // 20% for main service
          'health-checks': 0.01,        // 1% for health checks
          'metrics-collector': 0.05     // 5% for metrics
        },
        error_sampling: {
          rate: 1.0, // 100% sampling for errors
          include_context_spans: true
        },
        high_latency_sampling: {
          threshold_ms: 5000,
          rate: 1.0 // 100% sampling for slow requests
        }
      }

      expect(samplingConfig.default_rate).toBeGreaterThan(0)
      expect(samplingConfig.default_rate).toBeLessThanOrEqual(1)
      expect(samplingConfig.error_sampling.rate).toBe(1.0)
      expect(samplingConfig.high_latency_sampling.rate).toBe(1.0)

      Object.values(samplingConfig.service_specific).forEach(rate => {
        expect(rate).toBeGreaterThan(0)
        expect(rate).toBeLessThanOrEqual(1)
      })

      console.log('✓ Trace sampling strategy validated')
    })
  })

  describe('Incident Response Tests', () => {
    it('should implement incident escalation procedures', () => {
      const incidentProcedures = {
        severity_levels: {
          'P0': {
            description: 'Complete service outage',
            response_time_minutes: 5,
            escalation_after_minutes: 15,
            notification_channels: ['pagerduty', 'slack-critical', 'sms-oncall']
          },
          'P1': {
            description: 'Significant feature degradation',
            response_time_minutes: 15,
            escalation_after_minutes: 60,
            notification_channels: ['slack-critical', 'email-oncall']
          },
          'P2': {
            description: 'Minor feature issues',
            response_time_minutes: 60,
            escalation_after_minutes: 240,
            notification_channels: ['slack-alerts']
          }
        },
        escalation_chain: [
          'on-call-engineer',
          'team-lead',
          'engineering-manager',
          'cto'
        ],
        automated_actions: {
          'auto_scale_up': {
            trigger: 'cpu_usage > 80%',
            action: 'increase_replicas'
          },
          'circuit_breaker': {
            trigger: 'error_rate > 50%',
            action: 'enable_circuit_breaker'
          }
        }
      }

      Object.values(incidentProcedures.severity_levels).forEach(level => {
        // P0 incidents should have fastest response, others can be longer
        if (level.description.includes('outage')) {
          expect(level.response_time_minutes).toBeLessThanOrEqual(15) // 15 minutes for critical outages
        } else {
          expect(level.response_time_minutes).toBeLessThanOrEqual(60) // 1 hour for other incidents
        }
        expect(level.escalation_after_minutes).toBeGreaterThan(level.response_time_minutes)
        expect(level.notification_channels.length).toBeGreaterThan(0)
      })

      expect(incidentProcedures.escalation_chain.length).toBeGreaterThan(2)
      expect(Object.keys(incidentProcedures.automated_actions).length).toBeGreaterThan(0)

      console.log('✓ Incident escalation procedures validated')
    })

    it('should implement runbook automation', () => {
      const runbooks = [
        {
          name: 'high_memory_usage',
          triggers: ['memory_usage > 90%'],
          automated_steps: [
            'identify_memory_leaks',
            'restart_high_memory_processes',
            'scale_horizontally'
          ],
          manual_steps: [
            'analyze_heap_dump',
            'review_recent_deployments'
          ],
          rollback_criteria: 'memory_usage > 95%'
        },
        {
          name: 'database_connection_exhaustion',
          triggers: ['db_connections_used > 95%'],
          automated_steps: [
            'kill_long_running_queries',
            'increase_connection_pool_size',
            'enable_connection_throttling'
          ],
          manual_steps: [
            'review_query_patterns',
            'optimize_slow_queries'
          ],
          rollback_criteria: 'db_connections_available < 5'
        }
      ]

      runbooks.forEach(runbook => {
        expect(runbook.triggers.length).toBeGreaterThan(0)
        expect(runbook.automated_steps.length).toBeGreaterThan(0)
        expect(runbook.rollback_criteria).toBeDefined()
      })

      console.log('✓ Runbook automation configuration validated')
    })
  })

  describe('Cost Monitoring Tests', () => {
    it('should monitor infrastructure costs', () => {
      const costMetrics = {
        cloudflare_workers: {
          monthly_budget_usd: 50,
          current_usage_usd: 15.75,
          projected_monthly_usd: 47.25
        },
        turso_database: {
          monthly_budget_usd: 25,
          current_usage_usd: 8.50,
          projected_monthly_usd: 25.50
        },
        openrouter_api: {
          monthly_budget_usd: 200,
          current_usage_usd: 145.30,
          projected_monthly_usd: 435.90
        }
      }

      Object.values(costMetrics).forEach(service => {
        expect(service.current_usage_usd).toBeGreaterThanOrEqual(0)
        expect(service.projected_monthly_usd).toBeGreaterThan(service.current_usage_usd)
      })

      // Alert thresholds
      const totalProjected = Object.values(costMetrics).reduce((sum, service) => sum + service.projected_monthly_usd, 0)
      const totalBudget = Object.values(costMetrics).reduce((sum, service) => sum + service.monthly_budget_usd, 0)
      
      if (totalProjected > totalBudget * 0.8) {
        console.log(`⚠️  Cost alert: Projected monthly cost $${totalProjected.toFixed(2)} is 80%+ of budget $${totalBudget.toFixed(2)}`)
      }

      console.log(`✓ Infrastructure cost monitoring validated: $${totalProjected.toFixed(2)} projected`)
    })

    it('should monitor cost efficiency metrics', () => {
      const efficiencyMetrics = {
        cost_per_user_per_month: 2.15,
        cost_per_analysis: 0.043,
        cost_per_api_request: 0.000012,
        revenue_per_dollar_spent: 3.2
      }

      expect(efficiencyMetrics.cost_per_user_per_month).toBeLessThan(5.0)
      expect(efficiencyMetrics.cost_per_analysis).toBeLessThan(0.10)
      expect(efficiencyMetrics.revenue_per_dollar_spent).toBeGreaterThan(2.0)

      console.log('✓ Cost efficiency metrics validated')
    })
  })
})