<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

/**
 * Bio de um usuário: slug, plano e JSON (rascunho, publicado e backup).
 *
 * @property int $id
 * @property int $user_id
 * @property string $slug
 * @property string $plan
 * @property string $status
 * @property string|null $theme_pack_id
 * @property string $analytics_key
 * @property array<string, mixed>|null $json_draft
 * @property array<string, mixed>|null $json_published
 * @property array<string, mixed>|null $json_backup
 */
#[Fillable([
    'user_id',
    'slug',
    'plan',
    'status',
    'theme_pack_id',
    'json_draft',
    'json_published',
    'json_backup',
    'analytics_key',
])]
class Bio extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'json_draft' => 'array',
            'json_published' => 'array',
            'json_backup' => 'array',
        ];
    }

    /**
     * Dono da bio.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<Media, $this>
     */
    public function media(): HasMany
    {
        return $this->hasMany(Media::class);
    }

    /**
     * @return HasOne<CustomDomain, $this>
     */
    public function customDomain(): HasOne
    {
        return $this->hasOne(CustomDomain::class);
    }

    /**
     * @return HasOne<Subscription, $this>
     */
    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->latestOfMany();
    }

    /**
     * @return HasMany<AnalyticsEvent, $this>
     */
    public function analyticsEvents(): HasMany
    {
        return $this->hasMany(AnalyticsEvent::class);
    }

    /**
     * Páginas internas desta bio.
     *
     * @return HasMany<BioPage, $this>
     */
    public function pages(): HasMany
    {
        return $this->hasMany(BioPage::class);
    }

    /**
     * Leads do funil desta bio.
     *
     * @return HasMany<Lead, $this>
     */
    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    /**
     * Plano Pro (sem watermark e com domínio próprio).
     */
    public function isPro(): bool
    {
        return $this->plan === 'pro';
    }

    /**
     * Bio visível publicamente.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Exibe a marca d'água da plataforma no plano Free.
     */
    public function showsWatermark(): bool
    {
        return (bool) config('linksnabio.plans.'.$this->plan.'.watermark', true);
    }

    /**
     * JSON publicado da bio, se existir.
     *
     * @return array<string, mixed>|null
     */
    public function publishedConfig(): ?array
    {
        return $this->json_published;
    }

    /**
     * JSON usado no editor (rascunho, senão publicado).
     *
     * @return array<string, mixed>
     */
    public function editorConfig(): array
    {
        return $this->json_draft ?? $this->json_published ?? [];
    }
}
