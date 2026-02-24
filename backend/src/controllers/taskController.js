const Task = require('../models/Task');

// GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .exec();
    res.status(200).json(tasks);
  } catch (error) {
    console.error('[Tasks] Failed to fetch tasks', { error: error.message });
    next(error);
  }
};

// POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const { title, description, priority, status } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Valid title is required' });
    }

    const resolvedStatus = status || 'todo';
    const completed = resolvedStatus === 'done';

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const task = await Task.create({
      title: title.trim(),
      description,
      priority,
      status: resolvedStatus,
      completed,
      imageUrl,
      owner: req.user.id,
    });

    console.log('[Tasks] Created task', {
      id: task._id.toString(),
      owner: req.user.id,
    });
    res.status(201).json(task);
  } catch (error) {
    console.error('[Tasks] Failed to create task', { error: error.message });
    next(error);
  }
};

// PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (!id) {
      return res.status(400).json({ message: 'Task id is required' });
    }

    if (updates.status) {
      updates.completed = updates.status === 'done';
    }

    delete updates.owner;

    const task = await Task.findOneAndUpdate(
      { _id: id, owner: req.user.id },
      updates,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('[Tasks] Updated task', {
      id: task._id.toString(),
      owner: req.user.id,
    });
    res.status(200).json(task);
  } catch (error) {
    console.error('[Tasks] Failed to update task', { error: error.message });
    next(error);
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Task id is required' });
    }

    const task = await Task.findOneAndDelete({
      _id: id,
      owner: req.user.id,
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    console.log('[Tasks] Deleted task', {
      id: task._id.toString(),
      owner: req.user.id,
    });
    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('[Tasks] Failed to delete task', { error: error.message });
    next(error);
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};

