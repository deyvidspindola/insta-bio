<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_health_endpoint_returns_ok(): void
    {
        $this->get('/up')->assertOk();
    }

    public function test_landing_renders(): void
    {
        $this->get('/')->assertOk();
    }
}
