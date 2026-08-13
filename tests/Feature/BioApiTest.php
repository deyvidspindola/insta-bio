<?php

namespace Tests\Feature;

use App\Models\Bio;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class BioApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_onboarding_creates_bio_and_public_page_works(): void
    {
        $user = User::factory()->create();

        $config = [
            'brand' => [
                'name' => 'Studio Luz',
                'template' => 'classic',
                'theme' => ['primary' => '#f90'],
                'seo' => ['title' => 'Studio Luz', 'description' => ''],
            ],
            'sections' => [
                [
                    'id' => 'links',
                    'title' => 'Links',
                    'items' => [
                        ['type' => 'link', 'title' => 'WhatsApp', 'url' => 'https://wa.me/55'],
                    ],
                ],
            ],
        ];

        $this->actingAs($user)
            ->postJson('/api/onboarding', [
                'slug' => 'studio-luz',
                'theme_pack_id' => 'dark-agency',
                'config' => $config,
            ])
            ->assertOk()
            ->assertJsonPath('slug', 'studio-luz');

        $this->get('/studio-luz')->assertOk();
        $this->getJson('/api/public/bio/studio-luz')
            ->assertOk()
            ->assertJsonPath('brand.name', 'Studio Luz');
    }

    public function test_save_and_publish_roundtrip(): void
    {
        $user = $this->userWithBio();
        $config = $user->bio->json_published;
        $config['brand']['name'] = 'Nome Novo';

        $this->actingAs($user)
            ->postJson('/api/bio/save', $config)
            ->assertOk();

        $this->actingAs($user)
            ->postJson('/api/bio/publish', $config)
            ->assertOk();

        $this->assertSame('Nome Novo', $user->bio()->first()->json_published['brand']['name']);
    }

    public function test_free_plan_rejects_too_many_links(): void
    {
        $user = $this->userWithBio();
        $items = [];
        for ($i = 0; $i < 9; $i++) {
            $items[] = ['type' => 'link', 'title' => "Link {$i}", 'url' => 'https://example.com/'.$i];
        }
        $config = $user->bio->json_published;
        $config['sections'][0]['items'] = $items;

        $this->actingAs($user)
            ->postJson('/api/bio/save', $config)
            ->assertStatus(422);
    }

    public function test_reserved_slug_is_rejected(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/onboarding', [
                'slug' => 'admin',
                'config' => ['brand' => ['name' => 'X', 'template' => 'classic'], 'sections' => []],
            ])
            ->assertStatus(422);
    }

    public function test_custom_domain_forbidden_on_free(): void
    {
        $user = $this->userWithBio();

        $this->actingAs($user)
            ->postJson('/api/domain', ['domain' => 'bio.cliente.com.br'])
            ->assertStatus(403);
    }

    public function test_pro_can_save_custom_domain(): void
    {
        $user = $this->userWithBio();
        $user->bio->update(['plan' => 'pro']);

        $this->actingAs($user)
            ->postJson('/api/domain', ['domain' => 'bio.cliente.com.br'])
            ->assertOk()
            ->assertJsonPath('domain.domain', 'bio.cliente.com.br');
    }

    public function test_admin_can_suspend_bio(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $user = $this->userWithBio();

        $this->actingAs($admin)
            ->patchJson('/api/admin/bios/'.$user->bio->id, ['status' => 'suspended'])
            ->assertOk();

        $this->assertSame('suspended', $user->bio()->first()->status);
    }

    public function test_analytics_track_records_event(): void
    {
        $user = $this->userWithBio();

        $this->postJson('/api/analytics/track', [
            'analytics_key' => $user->bio->analytics_key,
            'event_type' => 'pageview',
            'visitor_id' => (string) Str::uuid(),
        ])->assertOk();

        $this->assertDatabaseCount('analytics_events', 1);
    }

    private function userWithBio(): User
    {
        $user = User::factory()->create();
        Bio::query()->create([
            'user_id' => $user->id,
            'slug' => 'minha-bio',
            'plan' => 'free',
            'status' => 'active',
            'analytics_key' => (string) Str::uuid(),
            'json_draft' => $this->sampleConfig(),
            'json_published' => $this->sampleConfig(),
        ]);

        return $user->fresh();
    }

    /**
     * @return array<string, mixed>
     */
    private function sampleConfig(): array
    {
        return [
            'brand' => [
                'name' => 'Minha Bio',
                'template' => 'classic',
                'theme' => ['primary' => '#f90'],
                'seo' => ['title' => 'Minha Bio', 'description' => ''],
            ],
            'sections' => [
                [
                    'id' => 'links',
                    'title' => 'Links',
                    'items' => [
                        ['type' => 'link', 'title' => 'Site', 'url' => 'https://example.com'],
                    ],
                ],
            ],
        ];
    }
}
