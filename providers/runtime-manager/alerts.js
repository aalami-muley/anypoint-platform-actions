"use strict";

const client = require("../../lib/client");
const { error, info } = require("../../lib/logger");

const HYBRID_TYPE_MAPPING = {
    SERVER: "server",
    SERVER_GROUP: "server-group",
    CLUSTER: "cluster"
};

const SEVERITY = {
    CRITICAL: {
        label: "Critical",
        value: "CRITICAL",
        order: 0
    },
    WARNING: {
        label: "Warning",
        value: "WARNING",
        order: 1
    },
    INFO: {
        label: "Info",
        value: "INFO",
        order: 2
    }
};

const CPU_USAGES = {
    10: {
        label: "10%",
        value: 10
    },
    20: {
        label: "20%",
        value: 20
    },
    30: {
        label: "30%",
        value: 30
    },
    40: {
        label: "40%",
        value: 40
    },
    50: {
        label: "50%",
        value: 50
    },
    60: {
        label: "60%",
        value: 60
    },
    70: {
        label: "70%",
        value: 70
    },
    80: {
        label: "80%",
        value: 80
    },
    90: {
        label: "90%",
        value: 90
    }
};

const SOURCE_TYPES = {
    application: {
        label: "Applications",
        value: "application"
    },
    server: {
        label: "Servers",
        value: "server"
    }
};

const SERVER_TYPE = {
    server: {
        label: "Servers",
        value: "server",
        productName: "hybrid"
    },
    "server-group": {
        label: "Server Groups",
        value: "server-group",
        productName: "hybrid"
    },
    cluster: {
        label: "Clusters",
        value: "cluster",
        productName: "hybrid"
    }
}
const SOURCE_TYPE_ICONS = {
    application: "application-small",
    "cloudhub-application": "cloud-small",
    "hybrid-application": "hybrid-small",
    server: "server-small",
    "server-group": "server-group-small",
    cluster: "cluster-small"
};

const APPLICATION_TYPE = {
    "cloudhub-application": {
        label: "CloudHub Applications",
        value: "cloudhub-application",
        productName: "cloudhub"
    },
    "hybrid-application": {
        label: "Hybrid Applications",
        value: "hybrid-application",
        productName: "hybrid"
    }
};
const CONDITION_HYBRID_APPLICATION = {
    "application-success": {
        label: "Deployment success",
        filterLabel: "Deployment success - Hybrid",
        value: "application-success",
        resourceType: "hybrid-application",
        sourceType: "application",
        messageTemplate: {
            subject: "${severity}: ${name} Application successfully deployed",
            content: ["Hello,", "You are receiving this alert because:", "The application '${name}' has been successfully deployed.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "application-failure": {
        label: "Deployment failure",
        filterLabel: "Deployment failure - Hybrid",
        value: "application-failure",
        resourceType: "hybrid-application",
        sourceType: "application",
        messageTemplate: {
            subject: "${severity}: ${name} Application failed to deploy",
            content: ["Hello,", "You are receiving this alert because:", "The application '${name}' failed to deploy.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "application-undeployed": {
        label: "Application undeployed",
        filterLabel: "Application undeployed - Hybrid",
        value: "application-undeployed",
        resourceType: "hybrid-application",
        sourceType: "application",
        messageTemplate: {
            subject: "${severity}: ${name} Application undeployed",
            content: ["Hello,", "You are receiving this alert because:", "The application '${name}' was undeployed.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "application-error-count": {
        label: "Number of errors",
        filterLabel: "Number of errors - Hybrid",
        value: "application-error-count",
        resourceType: "hybrid-application",
        sourceType: "application",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${name} number of errors",
            content: ["Hello,", "You are receiving this alert because:", "The application '${name}' (id: ${resource}) has an error rate of ${currentValue} which is equal or higher than the defined threshold of ${threshold}.", "", "The severity level is ${severity}.", "", "More details: ${location}"].join("\n")
        }
    },
    "application-response-time": {
        label: "Response time",
        filterLabel: "Response time - Hybrid",
        value: "application-response-time",
        resourceType: "hybrid-application",
        sourceType: "application",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${name} response time",
            content: ["Hello,", "You are receiving this alert because:", "The application '${name}' (id: ${resource}) has a response time of ${currentValue} which is equal or higher than the defined threshold of ${threshold}.", "", "The severity level is ${severity}.", "", "More details: ${location}"].join("\n")
        }
    },
    "application-message-count": {
        label: "Number of Mule messages",
        filterLabel: "Number of Mule messages - Hybrid",
        value: "application-message-count",
        resourceType: "hybrid-application",
        sourceType: "application",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${name} number of Mule messages",
            content: ["Hello,", "You are receiving this alert because:", "The application '${name}' (id: ${resource}) has a Mule message rate of ${currentValue} which is equal or higher than the defined threshold of ${threshold}.", "", "The severity level is ${severity}.", "", "More details: ${location}"].join("\n")
        }
    }
};
const CONDITION_CH_APPLICATION = {
    "cpu": {
        label: "CPU usage - Cloudhub",
        value: "cpu",
        resourceType: "cloudhub-application",
        sourceType: "application",
        messageTemplate: {
            subject: "${severity}: CPU usage ${state}",
            content: ["Hello,", "You are receiving this alert because:", "The application ${resource} is now in an ${state} state, based on the condition 'CPU ${operator} ${value}%'."].join("\n")
        }
    },
    "memory": {
        label: "Memory usage - Cloudhub",
        value: "memory",
        resourceType: "cloudhub-application",
        sourceType: "application",
        messageTemplate: {
            subject: "${severity}: memory usage ${state}",
            content: ["Hello,", "You are receiving this alert because:", "The application ${resource} is now in an ${state} state, based on the condition 'memory ${operator} ${value}%'."].join("\n")
        }
    },
    "application-notification": {
        label: "Custom application notification",
        value: "application-notification",
        resourceType: "cloudhub-application",
        sourceType: "application",
        messageTemplate: {
            subject: "${severity}: Custom Application Notification",
            content: ["Hello,", "You are receiving this alert because:", "The application ${resource} has a new ${priority} notification:", "${message}"].join("\n")
        }
    },
    "event-threshold-exceeded": {
        label: "Exceeds event traffic threshold",
        value: "event-threshold-exceeded",
        resourceType: "cloudhub-application",
        sourceType: "application",
        messageTemplate: {
            subject: "${severity}: Event Threshold Exceeded",
            content: ["Hello,", "You are receiving this alert because:", "The application ${resource} has exceeded the configured event threshold"].join("\n")
        }
    },
    "sdg-down": {
        label: "Secure data gateway disconnected",
        value: "sdg-down",
        resourceType: "cloudhub-application",
        sourceType: "application",
        messageTemplate: {
            subject: "${severity}: Secure Data Gateway Disconnected",
            content: ["Hello,", "You are receiving this alert because:", "The Secure Data Gateway your application ${resource} is no longer connected. While it is disconnected, your integrations may not function properly. For more information on the Secure Data Gateway, please see http://www.mulesoft.org/documentation/display/CLOUDHUB/Secure+Data+Gateway"].join("\n")
        }
    },
    "sdg-up": {
        label: "Secure data gateway connected",
        value: "sdg-up",
        resourceType: "cloudhub-application",
        sourceType: "application",
        messageTemplate: {
            subject: "${severity}: Secure Data Gateway Connected",
            content: ["Hello,", "You are receiving this alert because:", "The Secure Data Gateway your application ${resource} is now connected. For more information on the Secure Data Gateway, please see http://www.mulesoft.org/documentation/display/CloudHub/Secure+Data+Gateway"].join("\n")
        }
    },
    "worker-unresponsive": {
        label: "Worker not responding",
        value: "worker-unresponsive",
        resourceType: "cloudhub-application",
        sourceType: "application",
        messageTemplate: {
            subject: "${severity}: Worker unresponsive",
            content: ["Hello,", "You are receiving this alert because:", "One of the workers from the application ${resource} has encountered a problem.", "Please check the notification and logs for more details."].join("\n")
        }
    },
    "deployment-success": {
        label: "Deployment success",
        filterLabel: "Deployment success - Cloudhub",
        value: "deployment-success",
        resourceType: "cloudhub-application",
        sourceType: "application",
        messageTemplate: {
            subject: "${severity}: Deployment Success",
            content: ["Hello,", "You are receiving this alert because:", "The deployment of the application ${resource} has succeeded.", "Please see /cloudhub/#/console/applications/${resource} for more details."].join("\n")
        }
    },
    "deployment-failed": {
        label: "Deployment failed",
        filterLabel: "Deployment failure - Cloudhub",
        value: "deployment-failed",
        resourceType: "cloudhub-application",
        sourceType: "application",
        messageTemplate: {
            subject: "${severity}: Deployment Failed",
            content: ["Hello,", "You are receiving this alert because:", "The deployment of the application ${resource} has failed. The error was ${message}.", "Please see /cloudhub/#/console/applications/${resource} for more details."].join("\n")
        }
    }
};
const CONDITION_AUTOSCALE = {
    autoscaled: {
        label: "Autoscaled",
        value: "autoscaled",
        resourceType: "cloudhub-application",
        sourceType: "application",
        messageTemplate: {
            subject: "${severity}: Application autoscale",
            content: ["Hello,", "You are receiving this alert because:", "An autoscale event was triggered for the application ${resource}. ${message}"].join("\n")
        }
    }
};
const CONDITION_SERVER = {
    "server-up": {
        label: "Server connected",
        value: "server-up",
        resourceType: "server",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${name} Server has connected",
            content: ["Hello,", "You are receiving this alert because:", "The Server '${name}' has connected.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "server-down": {
        label: "Server disconnected",
        value: "server-down",
        resourceType: "server",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${name} Server has disconnected",
            content: ["Hello,", "You are receiving this alert because:", "The Server '${name}' has disconnected.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "agent-version-change": {
        label: "Agent version changed",
        value: "agent-version-change",
        resourceType: "server",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${name} Agent version changed",
            content: ["Hello,", "You are receiving this alert because:", "The version of Mule Agent has changed on the target '${name}'.", "It has changed from '${oldVersion}' to '${newVersion}'", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "runtime-version-change": {
        label: "Runtime version changed",
        value: "runtime-version-change",
        resourceType: "server",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${name} Runtime version changed",
            content: ["Hello,", "You are receiving this alert because:", "The version of Runtime Agent has changed on the target '${name}'.", "It has changed from '${oldVersion}' to '${newVersion}'", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "server-deletion": {
        label: "Server deleted",
        value: "server-deletion",
        resourceType: "server",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${name} Server deleted",
            content: ["Hello,", "You are receiving this alert because:", "The Server '${name}' was deleted.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "server-cpu": {
        label: "Server CPU usage",
        value: "server-cpu",
        resourceType: "server",
        sourceType: "server",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${name} Server CPU usage",
            content: ["Hello,", "You are receiving this alert because:", "The target ${name} has a CPU usage of ${currentValue}%.", "This triggered an alert based on the condition 'CPU equal or ${comparison} ${threshold}%'.", "", "More details: ${location}"].join("\n")
        }
    },
    "server-memory": {
        label: "Server Memory usage",
        value: "server-memory",
        resourceType: "server",
        sourceType: "server",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${name} Server memory usage",
            content: ["Hello,", "You are receiving this alert because:", "The target ${name} has a memory usage of ${currentValue}MB.", "This triggered an alert based on the condition 'memory equal or ${comparison} ${threshold}MB'.", "", "More details: ${location}"].join("\n")
        }
    },
    "server-load-average": {
        label: "Server Load average",
        value: "server-load-average",
        resourceType: "server",
        sourceType: "server",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${name} Server load average",
            content: ["Hello,", "You are receiving this alert because:", "The target ${name} has a load average of ${currentValue}.", "This triggered an alert based on the condition 'load average equal or ${comparison} ${threshold}'.", "", "More details: ${location}"].join("\n")
        }
    },
    "server-thread-count": {
        label: "Server Thread count",
        value: "server-thread-count",
        resourceType: "server",
        sourceType: "server",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${name} Server thread count",
            content: ["Hello,", "You are receiving this alert because:", "The target ${name} has a thread count of ${currentValue}.", "This triggered an alert based on the condition 'thread count equal or ${comparison} ${threshold}'.", "", "More details: ${location}"].join("\n")
        }
    }
};
const CONDITION_SERVER_GROUP = {
    "server-group-deletion": {
        label: "Server Group deleted",
        value: "server-group-deletion",
        resourceType: "server-group",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${name} Server Group deleted",
            content: ["Hello,", "You are receiving this alert because:", "The Server Group '${name}' was deleted.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "server-group-member-added": {
        label: "Server added to Server Group",
        value: "server-group-member-added",
        resourceType: "server-group",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${memberName} added to the Server Group ${groupName}",
            content: ["Hello,", "You are receiving this alert because:", "The member '${memberName}' was added to the Server Group '${groupName}'.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "server-group-member-removed": {
        label: "Server removed from Server Group",
        value: "server-group-member-removed",
        resourceType: "server-group",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${memberName} removed from the Server Group ${groupName}",
            content: ["Hello,", "You are receiving this alert because:", "The member '${memberName}' was removed from the Server Group '${groupName}'.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "server-group-up": {
        label: "Server Group connected",
        value: "server-group-up",
        resourceType: "server-group",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${name} Server Group has connected",
            content: ["Hello,", "You are receiving this alert because:", "The Server Group '${name}' has connected.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "server-group-down": {
        label: "Server Group disconnected",
        value: "server-group-down",
        resourceType: "server-group",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${name} Server Group has disconnected",
            content: ["Hello,", "You are receiving this alert because:", "The Server Group '${name}' has disconnected.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "server-group-member-up": {
        label: "Server Group's node connected",
        value: "server-group-member-up",
        resourceType: "server-group",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${memberName} from the Server Group ${groupName} has connected",
            content: ["Hello,", "You are receiving this alert because:", "The member '${memberName}' has connected in the Server Group '${groupName}'.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "server-group-member-down": {
        label: "Server Group's node disconnected",
        value: "server-group-member-down",
        resourceType: "server-group",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${memberName} from the Server Group ${groupName} has disconnected",
            content: ["Hello,", "You are receiving this alert because:", "The member '${memberName}' has disconnected in the Server Group '${groupName}'.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "server-group-member-cpu": {
        label: "Server Group's node CPU usage",
        value: "server-group-member-cpu",
        resourceType: "server-group",
        sourceType: "server",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${memberName} from the Server Group ${groupName} CPU usage",
            content: ["Hello,", "You are receiving this alert because:", "The target ${memberName} from Server Group ${groupName} has a CPU usage of ${currentValue}%.", "This triggered an alert based on the condition 'CPU equal or ${comparison} ${threshold}%'.", "", "More details: ${location}"].join("\n")
        }
    },
    "server-group-member-memory": {
        label: "Server Group's node Memory usage",
        value: "server-group-member-memory",
        resourceType: "server-group",
        sourceType: "server",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${memberName} from the Server Group ${groupName} memory usage",
            content: ["Hello,", "You are receiving this alert because:", "The target ${memberName} from Server Group ${groupName} has a memory usage of ${currentValue}MB.", "This triggered an alert based on the condition 'memory equal or ${comparison} ${threshold}MB'.", "", "More details: ${location}"].join("\n")
        }
    },
    "server-group-member-load-average": {
        label: "Server Group's node Load average",
        value: "server-group-member-load-average",
        resourceType: "server-group",
        sourceType: "server",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${memberName} from the Server Group ${groupName} load average",
            content: ["Hello,", "You are receiving this alert because:", "The target ${memberName} from Server Group ${groupName} has a load average of ${currentValue}.", "This triggered an alert based on the condition 'load average equal or ${comparison} ${threshold}'.", "", "More details: ${location}"].join("\n")
        }
    },
    "server-group-member-thread-count": {
        label: "Server Group's node Thread count",
        value: "server-group-member-thread-count",
        resourceType: "server-group",
        sourceType: "server",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${memberName} from the Server Group ${groupName} thread count",
            content: ["Hello,", "You are receiving this alert because:", "The target ${memberName} from Server Group ${groupName} has a thread count of ${currentValue}.", "This triggered an alert based on the condition 'thread count equal or ${comparison} ${threshold}'.", "", "More details: ${location}"].join("\n")
        }
    }
};
const CONDITION_CLUSTER = {
    "cluster-deletion": {
        label: "Cluster deleted",
        value: "cluster-deletion",
        resourceType: "cluster",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${name} Cluster deleted",
            content: ["Hello,", "You are receiving this alert because:", "The Cluster '${name}' was deleted.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "cluster-member-added": {
        label: "Server added to Cluster",
        value: "cluster-member-added",
        resourceType: "cluster",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${memberName} added to the Cluster ${clusterName}",
            content: ["Hello,", "You are receiving this alert because:", "The member '${memberName}' was added to the Cluster '${clusterName}'", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "cluster-member-removed": {
        label: "Server removed from Cluster",
        value: "cluster-member-removed",
        resourceType: "cluster",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${memberName} removed from the Cluster ${clusterName}",
            content: ["Hello,", "You are receiving this alert because:", "The member '${memberName}' was removed from the Cluster '${clusterName}'", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "cluster-up": {
        label: "Cluster connected",
        value: "cluster-up",
        resourceType: "cluster",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${name} Cluster has connected",
            content: ["Hello,", "You are receiving this alert because:", "The Cluster '${name}' has connected.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "cluster-down": {
        label: "Cluster disconnected",
        value: "cluster-down",
        resourceType: "cluster",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${name} Cluster has disconnected",
            content: ["Hello,", "You are receiving this alert because:", "The Cluster '${name}' has disconnected.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "cluster-member-up": {
        label: "Cluster's node connected",
        value: "cluster-member-up",
        resourceType: "cluster",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${memberName} from the Cluster ${clusterName} has connected",
            content: ["Hello,", "You are receiving this alert because:", "The member '${memberName}' has connected in the Cluster '${clusterName}'", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "cluster-member-down": {
        label: "Cluster's node disconnected",
        value: "cluster-member-down",
        resourceType: "cluster",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${memberName} from the Cluster ${clusterName} has disconnected",
            content: ["Hello,", "You are receiving this alert because:", "The member '${memberName}' has disconnected in the Cluster '${clusterName}'", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "cluster-visibility-change": {
        label: "Cluster presents visibility issues",
        value: "cluster-visibility-change",
        resourceType: "cluster",
        sourceType: "server",
        messageTemplate: {
            subject: "${severity}: ${name} visibility issue",
            content: ["Hello,", "You are receiving this alert because:", "The Cluster '${name}' is having visibility issues.", "", "The severity level is ${severity}."].join("\n")
        }
    },
    "cluster-member-cpu": {
        label: "Cluster's node CPU usage",
        value: "cluster-member-cpu",
        resourceType: "cluster",
        sourceType: "server",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${memberName} from the Cluster ${clusterName} CPU usage",
            content: ["Hello,", "You are receiving this alert because:", "The target ${memberName} from Cluster ${clusterName} has a CPU usage of ${currentValue}%.", "This triggered an alert based on the condition 'CPU equal or ${comparison} ${threshold}%'.", "", "More details: ${location}"].join("\n")
        }
    },
    "cluster-member-memory": {
        label: "Cluster's node Memory usage",
        value: "cluster-member-memory",
        resourceType: "cluster",
        sourceType: "server",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${memberName} from the Cluster ${clusterName} memory usage",
            content: ["Hello,", "You are receiving this alert because:", "The target ${memberName} from Cluster ${clusterName} has a memory usage of ${currentValue}MB.", "This triggered an alert based on the condition 'memory equal or ${comparison} ${threshold}MB'.", "", "More details: ${location}"].join("\n")
        }
    },
    "cluster-member-thread-count": {
        label: "Cluster's node Thread count",
        value: "cluster-member-thread-count",
        resourceType: "cluster",
        sourceType: "server",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${memberName} from the Cluster ${clusterName} thread count",
            content: ["Hello,", "You are receiving this alert because:", "The target ${memberName} from Cluster ${clusterName} has a thread count of ${currentValue}.", "This triggered an alert based on the condition 'thread count equal or ${comparison} ${threshold}'.", "", "More details: ${location}"].join("\n")
        }
    },
    "cluster-member-load-average": {
        label: "Cluster's node Load average",
        value: "cluster-member-load-average",
        resourceType: "cluster",
        sourceType: "server",
        conditionType: "monitoring",
        messageTemplate: {
            subject: "${severity}: ${memberName} from the Cluster ${clusterName} load average",
            content: ["Hello,", "You are receiving this alert because:", "The target ${memberName} from Cluster ${clusterName} has a load average of ${currentValue}.", "This triggered an alert based on the condition 'load average or ${comparison} ${threshold}'.", "", "More details: ${location}"].join("\n")
        }
    }
};

const COMPARISON_OPERATOR = {
    "GREATER_THAN": {
        label: "Above",
        value: "GREATER_THAN"
    },
    "LESS_THAN": {
        label: "Below",
        value: "LESS_THAN"
    }
};

const PRIORITIES = {
    "ALL": {
        label: "Any",
        value: "ALL"
    },
    "WARN": {
        label: "Warn",
        value: "WARN"
    },
    "INFO": {
        label: "Info",
        value: "INFO"
    },
    "ERROR": {
        label: "Error",
        value: "ERROR"
    }
};

const TIME_UNITS = {
    "MONTH": {
        label: "Month",
        value: "MONTH"
    },
    "WEEK": {
        label: "Week",
        value: "WEEK"
    },
    "DAY": {
        label: "Day",
        value: "DAY"
    },
    "HOUR": {
        label: "Hour",
        value: "HOUR"
    },
    "MINUTE": {
        label: "Minute",
        value: "MINUTE"
    },
    "SECOND": {
        label: "Second",
        value: "SECOND"
    },
    "MILLISECOND": {
        label: "Millisecond",
        value: "MILLISECOND"
    }
};

const CONDITIONS_DEFAULT_VALUES = {
    "cpu": {
        operator: "GREATER_THAN",
        periodCount: 10,
        value: "80"
    },
    "memory": {
        operator: "GREATER_THAN",
        periodCount: 10,
        value: "80"
    },
    "application-notification": {
        priority: "ALL",
        text: void 0
    },
    "application-message-count": {
        threshold: 10
    },
    "application-error-count": {
        threshold: 10
    },
    "application-response-time": {
        threshold: 100
    },
    "event-threshold-exceeded": {
        period: 10,
        periodTimeUnit: "MINUTE",
        threshold: 10
    },
    "server-cpu": {
        operator: "GREATER_THAN",
        threshold: "80",
        period: 10
    },
    "server-memory": {
        operator: "GREATER_THAN",
        threshold: 10,
        period: 10
    },
    "server-load-average": {
        operator: "GREATER_THAN",
        threshold: 10,
        period: 10
    },
    "server-thread-count": {
        operator: "GREATER_THAN",
        threshold: 10,
        period: 10
    },
    "server-group-member-cpu": {
        operator: "GREATER_THAN",
        threshold: "80",
        period: 10
    },
    "server-group-member-load-average": {
        operator: "GREATER_THAN",
        threshold: 10,
        period: 10
    },
    "server-group-member-memory": {
        operator: "GREATER_THAN",
        threshold: 10,
        period: 10
    },
    "server-group-member-thread-count": {
        operator: "GREATER_THAN",
        threshold: 10,
        period: 10
    },
    "cluster-member-cpu": {
        operator: "GREATER_THAN",
        threshold: "80",
        period: 10
    },
    "cluster-member-load-average": {
        operator: "GREATER_THAN",
        threshold: 10,
        period: 10
    },
    "cluster-member-memory": {
        operator: "GREATER_THAN",
        threshold: 10,
        period: 10
    },
    "cluster-member-thread-count": {
        operator: "GREATER_THAN",
        threshold: 10,
        period: 10
    }
};

const NUMBER_CONDITION_VALUES = ["periodCount", "value", "threshold", "period"];

const CONDITIONS_WITH_PERIOD_MINS = ["cpu", "memory"];

const CONDITIONAL_OPERATORS = ["operator", "threshold", "value", "period", "periodCount", "priority", "text", "periodTimeUnit"];

const data = {
    "name": "Name",
    "severity": "INFO",
    "actions": [
        {
            "type": "email",
            "content": "Hello,\nYou are receiving this alert because:\nThe deployment of the application ${resource} has failed. The error was ${message}.\nPlease see https://eu1.anypoint.mulesoft.com/cloudhub/#/console/applications/${resource} for more details.",
            "subject": "${severity}: Deployment Failed",
            "userIds": [
                "612cf2dd-9f92-4a08-97ed-f6be4faf06ca"
            ]
        }
    ],
    "condition": {
        "resourceType": "cloudhub-application",
        "type": "deployment-failed",
        "resources": [
            "httpbin",
            "mule-demo-inventory-sapi-v1"
        ]
    }
};


module.exports = function () {
    const url = "/armui/api/v1/alerts?limit=1000";
}