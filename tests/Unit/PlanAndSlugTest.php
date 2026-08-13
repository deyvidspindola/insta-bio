<?php

namespace Tests\Unit;

use App\Services\PlanGate;
use App\Services\SlugService;
use Tests\TestCase;

class PlanAndSlugTest extends TestCase
{
    public function test_slug_normalizes_and_rejects_reserved(): void
    {
        $service = new SlugService;
        $this->assertSame('igreja-expressar', $service->normalize('Igreja Expressar'));
        $this->assertNotNull($service->validate('ab'));
    }

    public function test_plan_gate_counts_links(): void
    {
        $gate = new PlanGate;
        $count = $gate->countLinks([
            'sections' => [
                ['items' => [
                    ['type' => 'link', 'url' => 'https://a.com'],
                    ['type' => 'text', 'text' => 'oi'],
                    ['type' => 'feature', 'url' => 'https://b.com'],
                ]],
            ],
        ]);
        $this->assertSame(2, $count);
    }
}
