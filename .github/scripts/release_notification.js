#!/usr/bin/env node
// Copyright (C) 2001-2023 Zabbix SIA
//
// Zabbix SIA licenses this file under the MIT License.
// See the LICENSE file in the project root for more information.
class ReleaseNotification {
    constructor() {
        this.mailServer = process.env.MAIL_SERVER || '';
        this.mailPort = parseInt(process.env.MAIL_PORT || '587');
        this.mailUser = process.env.MAIL_USER || '';
        this.mailPass = process.env.MAIL_PASS || '';
        this.recipientList = process.env.RELEASE_RECIPIENT_LIST || '';
        this.libraryVersion = process.env.LIBRARY_VERSION || '';
        this.repository = process.env.REPOSITORY || '';
    }
    async sendNotification() {
        if (!this.mailServer || !this.mailUser || !this.mailPass || !this.recipientList) {
            console.log('Missing email configuration, skipping notification');
            return;
        }
        const subject = `New release: typescript-zabbix-utils v${this.libraryVersion}`;
        const body = `
A new version of typescript-zabbix-utils has been released!

Version: ${this.libraryVersion}
Repository: https://github.com/${this.repository}
Release URL: https://github.com/${this.repository}/releases/tag/v${this.libraryVersion}

This is an automated notification.
        `.trim();
        const recipients = this.recipientList.split(',').map(email => email.trim());
        console.log('=== RELEASE NOTIFICATION ===');
        console.log(`Subject: ${subject}`);
        console.log(`Recipients: ${recipients.join(', ')}`);
        console.log(`Body:\n${body}`);
        console.log('============================');
        // TODO: Implement actual email sending with nodemailer
        // For now, just log the notification details
        console.log('✓ Release notification prepared (email sending not implemented yet)');
    }
}
// Run the notification
const notification = new ReleaseNotification();
notification.sendNotification().catch(console.error);
