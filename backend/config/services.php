<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'mcp_worker' => [
        'url' => env('MCP_WORKER_URL', 'http://localhost:3001'),
        'secret' => env('MCP_WORKER_SECRET'),
        'allowed_ips' => env('MCP_WORKER_ALLOWED_IPS', '127.0.0.1,::1'),
    ],

    'freemius' => [
        'product_id' => env('FREEMIUS_PRODUCT_ID'),
        'store_id' => env('FREEMIUS_STORE_ID'),
        'public_key' => env('FREEMIUS_PUBLIC_KEY'),
        'secret_key' => env('FREEMIUS_SECRET_KEY'),
        'plan_starter' => env('FREEMIUS_PLAN_STARTER'),
        'plan_growth' => env('FREEMIUS_PLAN_GROWTH'),
        'plan_business' => env('FREEMIUS_PLAN_BUSINESS'),
    ],

];
