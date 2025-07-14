#!/usr/bin/env tsx

/**
 * Integration test runner for Workers + Nuxt integration
 * 
 * This script:
 * 1. Starts the Workers dev server
 * 2. Runs the Nuxt dev server
 * 3. Executes E2E tests that verify the integration
 * 4. Cleans up both servers
 */

import { spawn, ChildProcess } from 'child_process'
import { setTimeout } from 'timers/promises'
import path from 'path'

class TestRunner {
  private workersProcess?: ChildProcess
  private nuxtProcess?: ChildProcess
  private workersPort = 8787
  private nuxtPort = 3000

  async run() {
    console.log('🚀 Starting Workers + Nuxt Integration Tests')
    
    try {
      // Start Workers dev server
      await this.startWorkers()
      
      // Start Nuxt dev server
      await this.startNuxt()
      
      // Wait for servers to be ready
      await this.waitForServers()
      
      // Run integration tests
      await this.runTests()
      
      console.log('✅ All integration tests passed!')
      
    } catch (error) {
      console.error('❌ Integration tests failed:', error)
      process.exit(1)
    } finally {
      await this.cleanup()
    }
  }

  private async startWorkers() {
    console.log('📦 Starting Cloudflare Workers dev server...')
    
    this.workersProcess = spawn('npm', ['run', 'dev'], {
      cwd: path.join(process.cwd(), 'pingtopass-workers'),
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: this.workersPort.toString(),
        NODE_ENV: 'test'
      }
    })

    this.workersProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      if (output.includes('Ready on')) {
        console.log('✅ Workers server ready')
      }
    })

    this.workersProcess.stderr?.on('data', (data) => {
      console.error('Workers stderr:', data.toString())
    })

    // Wait for startup
    await setTimeout(3000)
  }

  private async startNuxt() {
    console.log('🟢 Starting Nuxt dev server...')
    
    this.nuxtProcess = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      stdio: 'pipe',
      env: {
        ...process.env,
        PORT: this.nuxtPort.toString(),
        WORKERS_URL: `http://localhost:${this.workersPort}`,
        NODE_ENV: 'test'
      }
    })

    this.nuxtProcess.stdout?.on('data', (data) => {
      const output = data.toString()
      if (output.includes('Local:')) {
        console.log('✅ Nuxt server ready')
      }
    })

    this.nuxtProcess.stderr?.on('data', (data) => {
      console.error('Nuxt stderr:', data.toString())
    })

    // Wait for startup
    await setTimeout(5000)
  }

  private async waitForServers() {
    console.log('⏳ Waiting for servers to be ready...')
    
    // Test Workers health
    const workersHealthy = await this.testEndpoint(
      `http://localhost:${this.workersPort}/api/status/test`,
      'Workers'
    )
    
    // Test Nuxt health
    const nuxtHealthy = await this.testEndpoint(
      `http://localhost:${this.nuxtPort}/admin/question-generation`,
      'Nuxt'
    )

    if (!workersHealthy || !nuxtHealthy) {
      throw new Error('Servers failed to start properly')
    }
    
    console.log('✅ Both servers are ready')
  }

  private async testEndpoint(url: string, name: string): Promise<boolean> {
    try {
      const response = await fetch(url)
      console.log(`✅ ${name} responding (${response.status})`)
      return true
    } catch (error) {
      console.log(`❌ ${name} not responding:`, error)
      return false
    }
  }

  private async runTests() {
    console.log('🧪 Running integration tests...')
    
    // Run Playwright E2E tests for question generation
    const testProcess = spawn('npx', [
      'playwright', 'test',
      'tests/e2e/question-generation.spec.ts',
      '--headed=false'
    ], {
      cwd: process.cwd(),
      stdio: 'inherit',
      env: {
        ...process.env,
        BASE_URL: `http://localhost:${this.nuxtPort}`,
        WORKERS_URL: `http://localhost:${this.workersPort}`
      }
    })

    return new Promise<void>((resolve, reject) => {
      testProcess.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`Tests failed with exit code ${code}`))
        }
      })
    })
  }

  private async cleanup() {
    console.log('🧹 Cleaning up servers...')
    
    if (this.workersProcess) {
      this.workersProcess.kill('SIGTERM')
      console.log('🔴 Workers server stopped')
    }
    
    if (this.nuxtProcess) {
      this.nuxtProcess.kill('SIGTERM')
      console.log('🔴 Nuxt server stopped')
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Test runner interrupted')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n⚠️  Test runner terminated')
  process.exit(0)
})

// Run the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new TestRunner()
  runner.run().catch(console.error)
}