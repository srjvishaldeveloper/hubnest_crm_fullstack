const { sendSuccess, sendError } = require('../../utils/helpers');
const svc = require('./support.service');

async function getDashboard(req, res) {
  const data = await svc.getSupportDashboard(req.user.tenant_id, req.user.id, req.user.role_name);
  return sendSuccess(res, data, 'Dashboard retrieved successfully');
}

async function listTickets(req, res) {
  const { status, priority, category, assignedAgentId, search, page, limit } = req.query;
  const data = await svc.listTickets(req.user.tenant_id, req.user.id, req.user.role_name, {
    status,
    priority,
    category,
    assignedAgentId,
    search,
    page: +page || 1,
    limit: +limit || 50
  });
  return sendSuccess(res, data, 'Tickets retrieved successfully');
}

async function getTicket(req, res) {
  const data = await svc.getTicketById(req.user.tenant_id, req.params.id);
  if (!data) return sendError(res, 'Ticket not found', 404);
  return sendSuccess(res, data, 'Ticket retrieved successfully');
}

async function createTicket(req, res) {
  const { customerEmail, title, description, category } = req.body;
  if (!customerEmail || !title || !description || !category) {
    return sendError(res, 'customerEmail, title, description, and category are required', 400);
  }
  const ticket = await svc.createTicket(req.user.tenant_id, req.body);
  return sendSuccess(res, { ticket }, 'Ticket created successfully', 201);
}

async function updateTicket(req, res) {
  const ticket = await svc.updateTicket(req.user.tenant_id, req.params.id, req.body);
  if (!ticket) return sendError(res, 'Ticket not found or no updates provided', 404);
  return sendSuccess(res, { ticket }, 'Ticket updated successfully');
}

async function addMessage(req, res) {
  const { message, isInternalNote } = req.body;
  if (!message) return sendError(res, 'message is required', 400);

  const msg = await svc.addTicketMessage(
    req.user.tenant_id,
    req.params.id,
    req.user.id,
    'Agent',
    message,
    !!isInternalNote
  );
  return sendSuccess(res, { message: msg }, 'Message sent successfully', 201);
}

async function listCustomers(req, res) {
  const { status, search, page, limit } = req.query;
  const data = await svc.listCustomers(req.user.tenant_id, {
    status,
    search,
    page: +page || 1,
    limit: +limit || 50
  });
  return sendSuccess(res, data, 'Customers retrieved successfully');
}

async function getCustomer(req, res) {
  const data = await svc.getCustomerById(req.user.tenant_id, req.params.id);
  if (!data) return sendError(res, 'Customer not found', 404);
  return sendSuccess(res, data, 'Customer retrieved successfully');
}

async function listArticles(req, res) {
  const { category, status, search } = req.query;
  const articles = await svc.listArticles(req.user.tenant_id, { category, status, search });
  return sendSuccess(res, { articles }, 'Articles retrieved successfully');
}

async function getArticle(req, res) {
  const article = await svc.getArticleById(req.user.tenant_id, req.params.id);
  if (!article) return sendError(res, 'Article not found', 404);
  return sendSuccess(res, { article }, 'Article retrieved successfully');
}

async function createArticle(req, res) {
  const { title, content, category } = req.body;
  if (!title || !content || !category) {
    return sendError(res, 'title, content, and category are required', 400);
  }
  const article = await svc.createArticle(req.user.tenant_id, req.user.id, req.body);
  return sendSuccess(res, { article }, 'Article created successfully', 201);
}

async function updateArticle(req, res) {
  const article = await svc.updateArticle(req.user.tenant_id, req.params.id, req.body);
  if (!article) return sendError(res, 'Article not found or no updates provided', 404);
  return sendSuccess(res, { article }, 'Article updated successfully');
}

async function rateArticle(req, res) {
  const { isLike } = req.body;
  if (isLike === undefined) return sendError(res, 'isLike boolean is required', 400);

  const article = await svc.rateArticle(req.user.tenant_id, req.params.id, req.user.id, isLike);
  return sendSuccess(res, { article }, 'Article rated successfully');
}

async function bulkUpdateTickets(req, res) {
  const { ticketIds, actionData } = req.body;
  if (!ticketIds || !Array.isArray(ticketIds)) return sendError(res, 'ticketIds array is required', 400);
  const tickets = await svc.bulkUpdateTickets(req.user.tenant_id, ticketIds, actionData || {});
  return sendSuccess(res, { tickets }, 'Tickets bulk updated successfully');
}

async function escalateTicket(req, res) {
  const ticket = await svc.escalateTicket(req.user.tenant_id, req.params.id);
  if (!ticket) return sendError(res, 'Ticket not found', 404);
  return sendSuccess(res, { ticket }, 'Ticket escalated successfully');
}

async function assignTicket(req, res) {
  const { assignedAgentId } = req.body;
  const ticket = await svc.assignTicket(req.user.tenant_id, req.params.id, assignedAgentId);
  if (!ticket) return sendError(res, 'Ticket not found', 404);
  return sendSuccess(res, { ticket }, 'Ticket assigned successfully');
}

async function createCustomer(req, res) {
  const { name, email } = req.body;
  if (!name || !email) return sendError(res, 'name and email are required', 400);
  const customer = await svc.createCustomer(req.user.tenant_id, req.body);
  return sendSuccess(res, { customer }, 'Customer created successfully', 201);
}

async function updateCustomer(req, res) {
  const customer = await svc.updateCustomer(req.user.tenant_id, req.params.id, req.body);
  if (!customer) return sendError(res, 'Customer not found', 404);
  return sendSuccess(res, { customer }, 'Customer updated successfully');
}

async function addCustomerNote(req, res) {
  const { note } = req.body;
  if (!note) return sendError(res, 'note is required', 400);
  const data = await svc.addCustomerNote(req.user.tenant_id, req.params.id, note, req.user.name);
  return sendSuccess(res, { note: data }, 'Note added successfully', 201);
}

async function bulkUpdateCustomers(req, res) {
  const { customerIds, actionData } = req.body;
  if (!customerIds || !Array.isArray(customerIds)) return sendError(res, 'customerIds array is required', 400);
  const customers = await svc.bulkUpdateCustomers(req.user.tenant_id, customerIds, actionData || {});
  return sendSuccess(res, { customers }, 'Customers bulk updated successfully');
}

async function getSupportProfile(req, res) {
  const profile = await svc.getSupportProfile(req.user.tenant_id, req.user.id);
  return sendSuccess(res, profile, 'Profile retrieved successfully');
}

async function updateSupportProfile(req, res) {
  const profile = await svc.updateSupportProfile(req.user.tenant_id, req.user.id, req.body);
  return sendSuccess(res, profile, 'Profile updated successfully');
}

async function getKbAnalytics(req, res) {
  const analytics = await svc.getKbAnalytics(req.user.tenant_id);
  return sendSuccess(res, analytics, 'KB Analytics retrieved successfully');
}

async function addKbComment(req, res) {
  const { comment } = req.body;
  if (!comment) return sendError(res, 'comment is required', 400);
  const data = await svc.addKbComment(req.user.tenant_id, req.params.id, req.user.id, comment);
  return sendSuccess(res, { comment: data }, 'Comment added successfully', 201);
}

module.exports = {
  getDashboard,
  listTickets,
  getTicket,
  createTicket,
  updateTicket,
  addMessage,
  listCustomers,
  getCustomer,
  listArticles,
  getArticle,
  createArticle,
  updateArticle,
  rateArticle,
  bulkUpdateTickets,
  escalateTicket,
  assignTicket,
  createCustomer,
  updateCustomer,
  addCustomerNote,
  bulkUpdateCustomers,
  getSupportProfile,
  updateSupportProfile,
  getKbAnalytics,
  addKbComment
};
