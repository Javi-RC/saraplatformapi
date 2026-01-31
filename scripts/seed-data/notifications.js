// Seed Notifications
const seedNotifications = async (users, projects, organizations) => {
  console.log('\n🔔 Creating notifications...');
  
  const { Notification, NotificationTypes } = require('../../src/models/notification.model');
  const normalizeType = (type) => NotificationTypes[type] || type;
  
  const notifications = [];
  
  // Get users by email for easy reference
  const getUserByEmail = (email) => users.find(u => u.email === email);
  
  // Auth notifications
  notifications.push(
    {
      recipient: getUserByEmail('carlos.dev@example.com')._id,
      type: 'EMAIL_CONFIRMATION',
      title: 'Welcome to the Platform',
      message: 'Your email has been successfully confirmed. You can now access all features.',
      priority: 'medium',
      status: 'read',
      channels: ['email', 'in_app'],
      deliveryInfo: new Map([
        ['email', { status: 'delivered', sentAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }],
        ['in_app', { status: 'read', sentAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }]
      ]),
      readAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    }
  );
  
  // CV notifications
  notifications.push(
    {
      recipient: getUserByEmail('pending.user1@example.com')._id,
      type: 'CV_SUBMITTED_TO_ORG',
      title: 'CV Submitted Successfully',
      message: 'Your CV has been submitted to Tech Innovators and is pending review.',
      metadata: {
        organizationId: organizations[0]._id.toString(),
        organizationName: 'Tech Innovators'
      },
      priority: 'high',
      status: 'read',
      channels: ['email', 'in_app'],
      deliveryInfo: new Map([
        ['email', { status: 'delivered', sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }],
        ['in_app', { status: 'read', sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }]
      ]),
      readAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      recipient: getUserByEmail('admin.techinnov@example.com')._id,
      type: 'CV_SUBMITTED_TO_ORG',
      title: 'New CV Submitted for Review',
      message: 'Roberto Silva Costa has submitted a CV for your review.',
      metadata: {
        userId: getUserByEmail('pending.user1@example.com')._id.toString(),
        userName: 'Roberto Silva Costa'
      },
      priority: 'medium',
      status: 'delivered',
      channels: ['email', 'in_app'],
      deliveryInfo: new Map([
        ['email', { status: 'delivered', sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }],
        ['in_app', { status: 'delivered', sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) }]
      ]),
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      recipient: getUserByEmail('carlos.dev@example.com')._id,
      type: 'CV_PROCESSED',
      title: 'CV Processing Complete',
      message: 'Your CV has been successfully processed and analyzed by our AI system.',
      metadata: {
        completenessScore: 95,
        suggestedImprovements: 2
      },
      priority: 'medium',
      status: 'read',
      channels: ['in_app'],
      deliveryInfo: new Map([
        ['in_app', { status: 'read', sentAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }]
      ]),
      readAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    }
  );
  
  // Project notifications
  const ecommerceProject = projects.find(p => p.projectName === 'E-Commerce Platform Modernization');
  if (ecommerceProject) {
    notifications.push(
      {
        recipient: getUserByEmail('carlos.dev@example.com')._id,
        type: 'PROJECT_CREATED',
        title: 'New Project Created',
        message: 'E-Commerce Platform Modernization project has been created and you are the project manager.',
        metadata: {
          projectId: ecommerceProject._id.toString(),
          projectName: ecommerceProject.projectName
        },
        priority: 'high',
        status: 'read',
        channels: ['email', 'in_app'],
        deliveryInfo: new Map([
          ['email', { status: 'delivered', sentAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }],
          ['in_app', { status: 'read', sentAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }]
        ]),
        readAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
      },
      {
        recipient: getUserByEmail('ana.frontend@example.com')._id,
        type: 'ASSIGNED_TO_PROJECT',
        title: 'Assigned to New Project',
        message: 'You have been assigned to E-Commerce Platform Modernization as Frontend Developer.',
        metadata: {
          projectId: ecommerceProject._id.toString(),
          projectName: ecommerceProject.projectName,
          role: 'Frontend Developer'
        },
        priority: 'high',
        status: 'delivered',
        channels: ['email', 'in_app'],
        deliveryInfo: new Map([
          ['email', { status: 'delivered', sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }],
          ['in_app', { status: 'delivered', sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }]
        ]),
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      },
      {
        recipient: getUserByEmail('david.backend@example.com')._id,
        type: 'ASSIGNED_TO_PROJECT',
        title: 'Assigned to New Project',
        message: 'You have been assigned to E-Commerce Platform Modernization as Backend Developer.',
        metadata: {
          projectId: ecommerceProject._id.toString(),
          projectName: ecommerceProject.projectName,
          role: 'Backend Developer'
        },
        priority: 'high',
        status: 'delivered',
        channels: ['email', 'in_app'],
        deliveryInfo: new Map([
          ['email', { status: 'delivered', sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }],
          ['in_app', { status: 'delivered', sentAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }]
        ]),
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
      }
    );
  }
  
  const mobileProject = projects.find(p => p.projectName === 'Mobile Banking App Redesign');
  if (mobileProject) {
    notifications.push(
      {
        recipient: getUserByEmail('carlos.dev@example.com')._id,
        type: 'PROJECT_ACTIVATED',
        title: 'Project Started',
        message: 'Mobile Banking App Redesign project has officially started.',
        metadata: {
          projectId: mobileProject._id.toString(),
          projectName: mobileProject.projectName,
          startDate: mobileProject.actualStartDate
        },
        priority: 'high',
        status: 'read',
        channels: ['email', 'in_app'],
        deliveryInfo: new Map([
          ['email', { status: 'delivered', sentAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }],
          ['in_app', { status: 'read', sentAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }]
        ]),
        readAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    );
  }
  
  const portalProject = projects.find(p => p.projectName === 'Customer Portal Development');
  if (portalProject) {
    notifications.push(
      {
        recipient: getUserByEmail('carlos.dev@example.com')._id,
        type: 'PROJECT_COMPLETED',
        title: 'Project Successfully Completed!',
        message: 'Congratulations! Customer Portal Development has been completed successfully.',
        metadata: {
          projectId: portalProject._id.toString(),
          projectName: portalProject.projectName,
          completedDate: portalProject.completedAt,
          delayDays: 5
        },
        priority: 'high',
        status: 'read',
        channels: ['email', 'in_app'],
        deliveryInfo: new Map([
          ['email', { status: 'delivered', sentAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) }],
          ['in_app', { status: 'read', sentAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) }]
        ]),
        readAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000)
      },
      {
        recipient: getUserByEmail('ana.frontend@example.com')._id,
        type: 'PROJECT_COMPLETED',
        title: 'Project Successfully Completed!',
        message: 'Great work! Customer Portal Development has been completed.',
        metadata: {
          projectId: portalProject._id.toString(),
          projectName: portalProject.projectName
        },
        priority: 'medium',
        status: 'read',
        channels: ['in_app'],
        deliveryInfo: new Map([
          ['in_app', { status: 'read', sentAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000) }]
        ]),
        readAt: new Date(Date.now() - 54 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 55 * 24 * 60 * 60 * 1000)
      }
    );
  }
  
  const cancelledProject = projects.find(p => p.projectName === 'Legacy System Replacement');
  if (cancelledProject) {
    notifications.push(
      {
        recipient: getUserByEmail('michael.arch@example.com')._id,
        type: 'PROJECT_CANCELLED',
        title: 'Project Cancelled',
        message: 'Legacy System Replacement has been cancelled due to budget constraints and unclear requirements.',
        metadata: {
          projectId: cancelledProject._id.toString(),
          projectName: cancelledProject.projectName,
          reason: 'Budget constraints and unclear requirements'
        },
        priority: 'urgent',
        status: 'read',
        channels: ['email', 'in_app'],
        deliveryInfo: new Map([
          ['email', { status: 'delivered', sentAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) }],
          ['in_app', { status: 'read', sentAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) }]
        ]),
        readAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
      }
    );
  }
  
  // Organization notifications
  notifications.push(
    {
      recipient: getUserByEmail('carlos.dev@example.com')._id,
      type: 'ORG_EMPLOYEE_ADDED',
      title: 'Added to Organization',
      message: 'You have been added to Tech Innovators as Senior Full Stack Developer.',
      metadata: {
        organizationId: organizations[0]._id.toString(),
        organizationName: 'Tech Innovators',
        position: 'Senior Full Stack Developer'
      },
      priority: 'high',
      status: 'read',
      channels: ['email', 'in_app'],
      deliveryInfo: new Map([
        ['email', { status: 'delivered', sentAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }],
        ['in_app', { status: 'read', sentAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }]
      ]),
      readAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
    },
    {
      recipient: getUserByEmail('admin.techinnov@example.com')._id,
      type: 'ORG_EMPLOYEE_STATUS_CHANGED',
      title: 'Employee Status Updated',
      message: 'Carlos Rodríguez Martín status changed to active.',
      metadata: {
        userId: getUserByEmail('carlos.dev@example.com')._id.toString(),
        userName: 'Carlos Rodríguez Martín',
        newStatus: 'active'
      },
      priority: 'low',
      status: 'delivered',
      channels: ['in_app'],
      deliveryInfo: new Map([
        ['in_app', { status: 'delivered', sentAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000), deliveredAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000) }]
      ]),
      createdAt: new Date(Date.now() - 59 * 24 * 60 * 60 * 1000)
    }
  );
  
  // Recent unread notifications
  notifications.push(
    {
      recipient: getUserByEmail('admin.techinnov@example.com')._id,
      type: 'ADMIN_ANNOUNCEMENT',
      title: 'System Maintenance Scheduled',
      message: 'Platform maintenance is scheduled for this weekend. Services may be briefly unavailable.',
      metadata: {
        maintenanceDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        duration: '4 hours'
      },
      priority: 'medium',
      status: 'sent',
      channels: ['email', 'in_app'],
      deliveryInfo: new Map([
        ['email', { status: 'sent', sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }],
        ['in_app', { status: 'sent', sentAt: new Date(Date.now() - 2 * 60 * 60 * 1000) }]
      ]),
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
    },
    {
      recipient: getUserByEmail('carlos.dev@example.com')._id,
      type: 'SYSTEM_UPDATE',
      title: 'New Features Available',
      message: 'Check out the new risk prediction dashboard with enhanced visualizations!',
      metadata: {
        features: ['Enhanced risk visualization', 'Team synergy analysis', 'Improved notifications']
      },
      priority: 'low',
      status: 'pending',
      channels: ['in_app'],
      deliveryInfo: new Map([
        ['in_app', { status: 'pending', sentAt: new Date() }]
      ]),
      createdAt: new Date()
    }
  );
  
  const normalizedNotifications = notifications.map((notification) => ({
    ...notification,
    type: normalizeType(notification.type)
  }));

  const createdNotifications = await Notification.insertMany(normalizedNotifications);
  console.log(`✅ Created ${createdNotifications.length} notifications`);
  return createdNotifications;
};

module.exports = { seedNotifications };
