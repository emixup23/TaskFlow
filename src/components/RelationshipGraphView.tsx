import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import {
  Network,
  Users,
  Tag,
  CheckCircle2,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  Filter,
  Eye,
  EyeOff,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
  Download,
  Info,
  Calendar,
  X,
  Play,
  Pause,
  Share2,
  Clock,
  Briefcase,
  FolderTree
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { Task, User, Status, GraphNode, GraphLink, GraphNodeType } from '../types';

export const RelationshipGraphView: React.FC = () => {
  const {
    tasks,
    statuses,
    setSelectedTaskId,
    graphSelectedUserId,
    setGraphSelectedUserId
  } = useTasks();
  const { users, currentUser, isAdmin, switchUser } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Focus and Filter states
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>(
    graphSelectedUserId || 'all'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isEgoView, setIsEgoView] = useState(false); // Only show direct connections of selected user
  const [showTags, setShowTags] = useState(true);
  const [showCollaborators, setShowCollaborators] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [chargeStrength, setChargeStrength] = useState<number>(-280);
  const [linkDistance, setLinkDistance] = useState<number>(90);
  const [isSimulating, setIsSimulating] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Inspector panel
  const [inspectedNode, setInspectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Sync graphSelectedUserId from context if set externally (e.g. from User Management)
  useEffect(() => {
    if (graphSelectedUserId) {
      setSelectedUserFilter(graphSelectedUserId);
    }
  }, [graphSelectedUserId]);

  // Handle user pill selection
  const handleUserSelect = (userId: string) => {
    setSelectedUserFilter(userId);
    setGraphSelectedUserId(userId === 'all' ? null : userId);
    setInspectedNode(null);
  };

  // Status mapping helper
  const statusMap = useMemo(() => {
    const map = new Map<string, Status>();
    statuses.forEach((s) => map.set(s.id, s));
    return map;
  }, [statuses]);

  // User mapping helper
  const userMap = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  // Derive Graph Nodes & Links
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const nodeMap = new Set<string>();

    // 1. Filter tasks
    let relevantTasks = tasks;
    if (!showCompletedTasks) {
      relevantTasks = relevantTasks.filter((t) => {
        const s = statusMap.get(t.statusId);
        return !s?.isDone;
      });
    }
    if (statusFilter !== 'all') {
      relevantTasks = relevantTasks.filter((t) => t.statusId === statusFilter);
    }

    // If an individual user is selected in Ego View mode:
    if (selectedUserFilter !== 'all' && isEgoView) {
      relevantTasks = relevantTasks.filter(
        (t) =>
          t.assigneeIds.includes(selectedUserFilter) ||
          t.createdBy === selectedUserFilter
      );
    }

    // 2. Add Users
    const activeUserIds = new Set<string>();
    if (selectedUserFilter !== 'all') {
      activeUserIds.add(selectedUserFilter);
      if (!isEgoView) {
        users.forEach((u) => activeUserIds.add(u.id));
      } else {
        // In ego view, also add co-assignees from relevant tasks
        relevantTasks.forEach((t) => {
          t.assigneeIds.forEach((uid) => activeUserIds.add(uid));
        });
      }
    } else {
      users.forEach((u) => activeUserIds.add(u.id));
    }

    activeUserIds.forEach((userId) => {
      const user = userMap.get(userId);
      if (!user) return;
      const isSelected = selectedUserFilter === user.id;
      const isCurrent = currentUser?.id === user.id;

      // Count tasks assigned to user
      const assignedCount = relevantTasks.filter((t) =>
        t.assigneeIds.includes(user.id)
      ).length;

      const nodeId = `user-${user.id}`;
      nodes.push({
        id: nodeId,
        type: 'user',
        label: user.name,
        sublabel: user.title || user.department,
        avatar: user.avatar,
        color: isSelected
          ? '#3b82f6'
          : isCurrent
          ? '#06b6d4'
          : user.role === 'admin'
          ? '#f59e0b'
          : '#10b981',
        radius: isSelected ? 28 : isCurrent ? 24 : 22,
        data: {
          user,
          assignedCount,
          isSelected,
          isCurrent
        }
      });
      nodeMap.add(nodeId);
    });

    // 3. Add Tasks
    const tagCountMap = new Map<string, number>();

    relevantTasks.forEach((task) => {
      const taskStatus = statusMap.get(task.statusId);
      const isDone = taskStatus?.isDone;
      const taskNodeId = `task-${task.id}`;

      // Status color fallback
      let statusColor = '#3b82f6';
      if (taskStatus?.color) {
        if (taskStatus.color.startsWith('#')) statusColor = taskStatus.color;
        else if (taskStatus.color.includes('emerald') || taskStatus.color.includes('green')) statusColor = '#10b981';
        else if (taskStatus.color.includes('amber') || taskStatus.color.includes('yellow')) statusColor = '#f59e0b';
        else if (taskStatus.color.includes('red') || taskStatus.color.includes('rose')) statusColor = '#ef4444';
        else if (taskStatus.color.includes('purple')) statusColor = '#a855f7';
      }

      nodes.push({
        id: taskNodeId,
        type: 'task',
        label: task.title,
        sublabel: taskStatus?.name || 'In Progress',
        color: statusColor,
        statusId: task.statusId,
        priority: task.priority,
        radius: isDone ? 16 : 19,
        data: {
          task,
          status: taskStatus
        }
      });
      nodeMap.add(taskNodeId);

      // Links: User -> Task (Assignment)
      task.assigneeIds.forEach((assigneeId) => {
        const userNodeId = `user-${assigneeId}`;
        if (nodeMap.has(userNodeId)) {
          links.push({
            id: `link-assign-${assigneeId}-${task.id}`,
            source: userNodeId,
            target: taskNodeId,
            type: 'assigned',
            label: 'Assigned',
            color: '#3b82f6',
            value: 2
          });
        }
      });

      // Links: User -> Task (Creator if not assigned)
      if (task.createdBy && !task.assigneeIds.includes(task.createdBy)) {
        const creatorNodeId = `user-${task.createdBy}`;
        if (nodeMap.has(creatorNodeId)) {
          links.push({
            id: `link-create-${task.createdBy}-${task.id}`,
            source: creatorNodeId,
            target: taskNodeId,
            type: 'created',
            label: 'Created by',
            color: '#64748b',
            value: 1
          });
        }
      }

      // Collect tags
      if (showTags && task.tags) {
        task.tags.forEach((tag) => {
          const cleanTag = tag.trim().toLowerCase();
          if (!cleanTag) return;
          tagCountMap.set(cleanTag, (tagCountMap.get(cleanTag) || 0) + 1);
        });
      }
    });

    // 4. Add Tags
    if (showTags) {
      tagCountMap.forEach((count, tagName) => {
        const tagNodeId = `tag-${tagName}`;
        // Color hash for tags
        let tagColor = '#8b5cf6';
        if (tagName.includes('bug') || tagName.includes('fix')) tagColor = '#ef4444';
        else if (tagName.includes('feature') || tagName.includes('ui')) tagColor = '#06b6d4';
        else if (tagName.includes('backend') || tagName.includes('api')) tagColor = '#10b981';
        else if (tagName.includes('design') || tagName.includes('auth')) tagColor = '#f59e0b';
        else if (tagName.includes('docs') || tagName.includes('test')) tagColor = '#ec4899';

        nodes.push({
          id: tagNodeId,
          type: 'tag',
          label: `#${tagName}`,
          sublabel: `${count} task${count > 1 ? 's' : ''}`,
          color: tagColor,
          radius: Math.min(22, 14 + count * 2),
          data: {
            tagName,
            count
          }
        });
        nodeMap.add(tagNodeId);

        // Links: Task -> Tag
        relevantTasks.forEach((task) => {
          if (
            task.tags &&
            task.tags.some((t) => t.trim().toLowerCase() === tagName)
          ) {
            const taskNodeId = `task-${task.id}`;
            if (nodeMap.has(taskNodeId)) {
              links.push({
                id: `link-tag-${task.id}-${tagName}`,
                source: taskNodeId,
                target: tagNodeId,
                type: 'tagged',
                label: 'Tagged',
                color: tagColor,
                value: 1.5
              });
            }
          }
        });
      });
    }

    // 5. Add Collaborator Links (User <-> User who share tasks)
    if (showCollaborators) {
      const coAssignmentPairs = new Map<string, number>();
      relevantTasks.forEach((task) => {
        if (task.assigneeIds.length > 1) {
          for (let i = 0; i < task.assigneeIds.length; i++) {
            for (let j = i + 1; j < task.assigneeIds.length; j++) {
              const u1 = task.assigneeIds[i];
              const u2 = task.assigneeIds[j];
              const key = u1 < u2 ? `${u1}__${u2}` : `${u2}__${u1}`;
              coAssignmentPairs.set(key, (coAssignmentPairs.get(key) || 0) + 1);
            }
          }
        }
      });

      coAssignmentPairs.forEach((sharedTasks, key) => {
        const [u1, u2] = key.split('__');
        const node1 = `user-${u1}`;
        const node2 = `user-${u2}`;
        if (nodeMap.has(node1) && nodeMap.has(node2)) {
          links.push({
            id: `link-collab-${u1}-${u2}`,
            source: node1,
            target: node2,
            type: 'collaborator',
            label: `${sharedTasks} shared task${sharedTasks > 1 ? 's' : ''}`,
            color: '#10b981',
            value: Math.min(4, 1 + sharedTasks * 0.8)
          });
        }
      });
    }

    return { nodes, links };
  }, [
    tasks,
    users,
    currentUser,
    selectedUserFilter,
    isEgoView,
    showTags,
    showCollaborators,
    showCompletedTasks,
    statusFilter,
    statusMap,
    userMap
  ]);

  // Set of node IDs connected to hovered node (for highlighting)
  const connectedNodeIds = useMemo(() => {
    if (!hoveredNode && !inspectedNode) return null;
    const target = hoveredNode || inspectedNode;
    if (!target) return null;

    const set = new Set<string>();
    set.add(target.id);

    graphData.links.forEach((l) => {
      const sId = typeof l.source === 'object' ? (l.source as any).id : l.source;
      const tId = typeof l.target === 'object' ? (l.target as any).id : l.target;

      if (sId === target.id) set.add(tId);
      if (tId === target.id) set.add(sId);
    });

    return set;
  }, [hoveredNode, inspectedNode, graphData.links]);

  // D3 Force Simulation & Rendering
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous render

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    // Main group for zooming & panning
    const g = svg.append('g').attr('class', 'graph-main-group');

    // Add Defs for Arrow Markers, Gradients, and Avatar Patterns
    const defs = svg.append('defs');

    // Add User Avatar Image Patterns
    users.forEach((u) => {
      const pattern = defs
        .append('pattern')
        .attr('id', `avatar-pattern-${u.id}`)
        .attr('width', 1)
        .attr('height', 1)
        .attr('patternContentUnits', 'objectBoundingBox');

      pattern
        .append('image')
        .attr('xlink:href', u.avatar)
        .attr('width', 1)
        .attr('height', 1)
        .attr('preserveAspectRatio', 'xMidYMid slice');
    });

    // Deep clone data for simulation so D3 doesn't mutate React state directly
    const simNodes: GraphNode[] = graphData.nodes.map((n) => ({ ...n }));
    const simLinks: GraphLink[] = graphData.links.map((l) => ({ ...l }));

    // Create D3 Force Simulation
    const simulation = d3
      .forceSimulation<GraphNode>(simNodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(simLinks)
          .id((d) => d.id)
          .distance((d) => {
            if (d.type === 'collaborator') return linkDistance * 1.4;
            if (d.type === 'tagged') return linkDistance * 0.85;
            return linkDistance;
          })
          .strength((d) => (d.type === 'assigned' ? 0.6 : 0.4))
      )
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force(
        'collide',
        d3.forceCollide<GraphNode>().radius((d) => (d.radius || 20) + 16).iterations(2)
      )
      .alphaDecay(0.028);

    simulationRef.current = simulation;

    // Zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomBehaviorRef.current = zoom;
    svg.call(zoom);

    // Initial Zoom / Center positioning
    svg.call(zoom.transform, d3.zoomIdentity.translate(0, 0).scale(1));

    // Links container
    const linkGroup = g.append('g').attr('class', 'links');
    const link = linkGroup
      .selectAll('line')
      .data(simLinks)
      .enter()
      .append('line')
      .attr('stroke', (d) => d.color || '#475569')
      .attr('stroke-width', (d) => (d.type === 'collaborator' ? 2 : d.value || 1.5))
      .attr('stroke-dasharray', (d) =>
        d.type === 'collaborator' ? '4,4' : d.type === 'created' ? '3,3' : 'none'
      )
      .attr('stroke-opacity', (d) => (d.type === 'collaborator' ? 0.5 : 0.7));

    // Nodes container
    const nodeGroup = g.append('g').attr('class', 'nodes');
    const node = nodeGroup
      .selectAll<SVGGElement, GraphNode>('g')
      .data(simNodes)
      .enter()
      .append('g')
      .attr('class', 'node-group cursor-pointer')
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            // keep fixed or unpin on double click
          })
      );

    // Unpin fixed node on double click
    node.on('dblclick', (event, d) => {
      event.stopPropagation();
      d.fx = null;
      d.fy = null;
      simulation.alpha(0.2).restart();
    });

    // Render node shapes according to type
    node.each(function (d) {
      const el = d3.select(this);
      const r = d.radius || 20;

      // Glow filter or halo for selected user
      if (d.type === 'user') {
        const isSelected = d.data?.isSelected;
        const isCurrent = d.data?.isCurrent;

        // Outer halo
        el.append('circle')
          .attr('r', r + (isSelected ? 6 : 4))
          .attr('fill', 'none')
          .attr('stroke', d.color || '#3b82f6')
          .attr('stroke-width', isSelected ? 3 : 2)
          .attr('stroke-opacity', isSelected ? 0.9 : 0.4)
          .attr('stroke-dasharray', isCurrent ? '4,3' : 'none');

        // User Avatar Circle
        el.append('circle')
          .attr('r', r)
          .attr('fill', `url(#avatar-pattern-${d.data?.user?.id})`)
          .attr('stroke', '#1e293b')
          .attr('stroke-width', 2);

        // Task count badge
        if (d.data?.assignedCount > 0) {
          const badgeG = el
            .append('g')
            .attr('transform', `translate(${r * 0.7}, ${-r * 0.7})`);

          badgeG
            .append('circle')
            .attr('r', 9)
            .attr('fill', '#2563eb')
            .attr('stroke', '#0d0d0d')
            .attr('stroke-width', 1.5);

          badgeG
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', 3.5)
            .attr('font-size', 10)
            .attr('font-weight', 'bold')
            .attr('fill', '#ffffff')
            .text(d.data.assignedCount);
        }
      } else if (d.type === 'task') {
        // Task Card Node (Rounded rectangle or Hexagon)
        const w = 40;
        const h = 26;
        el.append('rect')
          .attr('x', -w / 2)
          .attr('y', -h / 2)
          .attr('width', w)
          .attr('height', h)
          .attr('rx', 6)
          .attr('fill', '#141414')
          .attr('stroke', d.color || '#3b82f6')
          .attr('stroke-width', 2)
          .attr('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))');

        // Priority dot
        const priorityColors: Record<string, string> = {
          urgent: '#ef4444',
          high: '#f97316',
          medium: '#3b82f6',
          low: '#64748b'
        };
        const pColor = priorityColors[d.priority || 'medium'] || '#3b82f6';

        el.append('circle')
          .attr('cx', -w / 2 + 8)
          .attr('cy', -h / 2 + 8)
          .attr('r', 3.5)
          .attr('fill', pColor);

        // Task Icon Glyph in center
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', 4)
          .attr('dx', 2)
          .attr('font-size', 11)
          .attr('font-weight', 'bold')
          .attr('fill', '#cbd5e1')
          .text('TASK');
      } else if (d.type === 'tag') {
        // Tag Diamond / Pill
        el.append('rect')
          .attr('x', -34)
          .attr('y', -12)
          .attr('width', 68)
          .attr('height', 24)
          .attr('rx', 12)
          .attr('fill', '#1e1b4b')
          .attr('stroke', d.color || '#8b5cf6')
          .attr('stroke-width', 1.5);

        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', 4)
          .attr('font-size', 10.5)
          .attr('font-weight', 'bold')
          .attr('fill', '#e0e7ff')
          .text(d.label.length > 10 ? d.label.substring(0, 9) + '…' : d.label);
      }

      // Main Text Label beneath node
      if (d.type !== 'tag') {
        el.append('text')
          .attr('text-anchor', 'middle')
          .attr('dy', r + 14)
          .attr('font-size', d.type === 'user' ? 12 : 11)
          .attr('font-weight', d.type === 'user' ? '600' : '500')
          .attr('fill', '#f1f5f9')
          .attr('class', 'node-label select-none')
          .text(
            d.label.length > 18 ? d.label.substring(0, 16) + '…' : d.label
          );

        // Sublabel
        if (d.sublabel) {
          el.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', r + 26)
            .attr('font-size', 9.5)
            .attr('fill', '#94a3b8')
            .attr('class', 'node-sublabel select-none')
            .text(
              d.sublabel.length > 20
                ? d.sublabel.substring(0, 18) + '…'
                : d.sublabel
            );
        }
      }
    });

    // Node Event Listeners
    node
      .on('mouseenter', (event, d) => {
        setHoveredNode(d);
      })
      .on('mouseleave', () => {
        setHoveredNode(null);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        setInspectedNode(d);
        if (d.type === 'user') {
          setSelectedUserFilter(d.data?.user?.id);
          setGraphSelectedUserId(d.data?.user?.id);
        }
      });

    // Click canvas background to deselect inspector
    svg.on('click', () => {
      setInspectedNode(null);
    });

    // Simulation Tick Handler
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData, chargeStrength, linkDistance]);

  // Apply real-time node highlighting when hoveredNode or inspectedNode or searchQuery changes
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);

    const query = searchQuery.trim().toLowerCase();

    svg.selectAll('.node-group').each(function (d: any) {
      const el = d3.select(this);
      const isConnected = connectedNodeIds
        ? connectedNodeIds.has(d.id)
        : true;
      const matchesSearch = query
        ? d.label.toLowerCase().includes(query) ||
          (d.sublabel && d.sublabel.toLowerCase().includes(query))
        : true;

      const isDimmed = (connectedNodeIds && !isConnected) || (query && !matchesSearch);

      el.transition()
        .duration(180)
        .attr('opacity', isDimmed ? 0.15 : 1)
        .attr('transform', function () {
          const current = el.attr('transform');
          return current;
        });
    });

    svg.selectAll('line').each(function (l: any) {
      const el = d3.select(this);
      const sId = typeof l.source === 'object' ? l.source.id : l.source;
      const tId = typeof l.target === 'object' ? l.target.id : l.target;

      let isConnectedLink = true;
      if (connectedNodeIds) {
        isConnectedLink =
          connectedNodeIds.has(sId) && connectedNodeIds.has(tId);
      }

      el.transition()
        .duration(180)
        .attr('stroke-opacity', isConnectedLink ? 0.85 : 0.08)
        .attr('stroke-width', isConnectedLink ? (l.type === 'collaborator' ? 2.5 : 2.5) : 1);
    });
  }, [connectedNodeIds, searchQuery]);

  // Control Actions
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomBehaviorRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomBehaviorRef.current.scaleBy, 0.7);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current) return;
    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;
    d3.select(svgRef.current)
      .transition()
      .duration(400)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(0, 0).scale(1)
      );
  };

  const handleFitToScreen = () => {
    if (!svgRef.current || !zoomBehaviorRef.current || !containerRef.current || graphData.nodes.length === 0) return;
    const width = containerRef.current.clientWidth || 900;
    const height = containerRef.current.clientHeight || 650;

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    graphData.nodes.forEach((n: any) => {
      if (n.x !== undefined && n.y !== undefined) {
        if (n.x < minX) minX = n.x;
        if (n.x > maxX) maxX = n.x;
        if (n.y < minY) minY = n.y;
        if (n.y > maxY) maxY = n.y;
      }
    });

    if (minX === Infinity) return;

    const padding = 60;
    const dx = maxX - minX || 100;
    const dy = maxY - minY || 100;
    const x = (minX + maxX) / 2;
    const y = (minY + maxY) / 2;
    const scale = Math.min(
      3,
      Math.max(0.3, 0.85 / Math.max(dx / width, dy / height))
    );
    const translate = [width / 2 - scale * x, height / 2 - scale * y];

    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
      );
  };

  const toggleSimulation = () => {
    if (!simulationRef.current) return;
    if (isSimulating) {
      simulationRef.current.stop();
      setIsSimulating(false);
    } else {
      simulationRef.current.alpha(0.3).restart();
      setIsSimulating(true);
    }
  };

  const handleExportSvg = () => {
    if (!svgRef.current) return;
    const svgEl = svgRef.current;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TaskFlow-Relationship-Graph-${selectedUserFilter}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Selected User Object
  const currentFocusedUser = useMemo(() => {
    if (selectedUserFilter === 'all') return null;
    return users.find((u) => u.id === selectedUserFilter) || null;
  }, [selectedUserFilter, users]);

  return (
    <div
      id="relationship-graph-container"
      ref={containerRef}
      className={`relative flex-1 flex flex-col w-full h-full bg-[#0d0d0d] overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50 p-4' : ''
      }`}
    >
      {/* =========================================================================
          Top Control & Filter Ribbon
          ========================================================================= */}
      <div className="bg-[#121212] border-b border-[#262626] p-3 sm:px-6 flex flex-col gap-3 shrink-0">
        
        {/* Row 1: User Pills & View Mode */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          
          {/* User Selector Rail */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none max-w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mr-1 flex items-center gap-1 shrink-0">
              <Users className="w-3.5 h-3.5 text-blue-400" /> Focus User:
            </span>

            {/* All Team Members Pill */}
            <button
              type="button"
              id="graph-user-all"
              onClick={() => handleUserSelect('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 border ${
                selectedUserFilter === 'all'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30 font-bold'
                  : 'bg-[#1a1a1a] text-neutral-300 border-[#2b2b2b] hover:bg-[#252525] hover:text-white'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>All Team Network</span>
              <span className="ml-1 px-1.5 py-0.2 text-[10px] rounded-full bg-black/30 font-mono">
                {users.length}
              </span>
            </button>

            {/* Individual User Pills */}
            {users.map((u) => {
              const isSelected = selectedUserFilter === u.id;
              const isCurrent = currentUser?.id === u.id;
              const taskCount = tasks.filter((t) => t.assigneeIds.includes(u.id)).length;

              return (
                <button
                  key={u.id}
                  id={`graph-user-${u.id}`}
                  onClick={() => handleUserSelect(u.id)}
                  className={`px-2.5 py-1.5 rounded-full text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30 font-bold'
                      : isCurrent
                      ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/50'
                      : 'bg-[#1a1a1a] text-neutral-300 border-[#2b2b2b] hover:bg-[#252525] hover:text-white'
                  }`}
                  title={`${u.name} (${u.title || u.role}) - ${taskCount} assigned tasks`}
                >
                  <img
                    src={u.avatar}
                    alt={u.name}
                    className="w-4 h-4 rounded-full object-cover shrink-0 border border-white/20"
                  />
                  <span className="truncate max-w-[110px]">
                    {u.name} {isCurrent && '(You)'}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono font-semibold ${
                      isSelected ? 'bg-black/30 text-white' : 'bg-[#262626] text-neutral-400'
                    }`}
                  >
                    {taskCount}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Metrics Bar */}
          <div className="hidden xl:flex items-center gap-3 text-xs text-neutral-400 bg-[#171717] px-3 py-1.5 rounded border border-[#262626]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <strong className="text-white">{graphData.nodes.length}</strong> Entities
            </span>
            <span className="text-neutral-600">•</span>
            <span className="flex items-center gap-1.5">
              <strong className="text-white">{graphData.links.length}</strong> Relationships
            </span>
            {currentFocusedUser && (
              <>
                <span className="text-neutral-600">•</span>
                <span className="text-blue-400 font-medium truncate max-w-[150px]">
                  Viewing: {currentFocusedUser.name}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Row 2: Graph Mode, Filters, Search & View Controls */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          
          {/* Left: Search & Entity Toggles */}
          <div className="flex items-center gap-2.5 flex-wrap">
            
            {/* Quick Node Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                id="graph-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find task, user, or tag..."
                className="pl-8 pr-3 py-1 bg-[#181818] border border-[#2b2b2b] rounded text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500 w-44 sm:w-56"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Ego / Isolation Mode Toggle (when user selected) */}
            {selectedUserFilter !== 'all' && (
              <button
                type="button"
                id="graph-toggle-ego-view"
                onClick={() => setIsEgoView(!isEgoView)}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isEgoView
                    ? 'bg-blue-600/20 text-blue-300 border-blue-500/40'
                    : 'bg-[#181818] text-neutral-400 border-[#2b2b2b] hover:text-white'
                }`}
                title="Isolate only this user's direct tasks and connections"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isEgoView ? 'Isolated Ego Network' : 'Full Network'}</span>
              </button>
            )}

            {/* Show Tags Toggle */}
            <button
              type="button"
              id="graph-toggle-tags"
              onClick={() => setShowTags(!showTags)}
              className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                showTags
                  ? 'bg-purple-950/40 text-purple-300 border-purple-800/60'
                  : 'bg-[#181818] text-neutral-500 border-[#2b2b2b] line-through'
              }`}
            >
              <Tag className="w-3.5 h-3.5" />
              <span>Tags</span>
            </button>

            {/* Show Collaborators Toggle */}
            <button
              type="button"
              id="graph-toggle-collab"
              onClick={() => setShowCollaborators(!showCollaborators)}
              className={`px-2.5 py-1 rounded text-xs flex items-center gap-1.5 transition-all cursor-pointer border ${
                showCollaborators
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : 'bg-[#181818] text-neutral-500 border-[#2b2b2b] line-through'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Team Bridges</span>
            </button>

            {/* Status Filter Dropdown */}
            <select
              id="graph-status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1 bg-[#181818] border border-[#2b2b2b] rounded text-xs text-neutral-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Workflow Statuses</option>
              {statuses.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Right: Zoom & Layout Action Controls */}
          <div className="flex items-center gap-1.5">
            {/* Play / Pause simulation */}
            <button
              type="button"
              id="graph-btn-pause-play"
              onClick={toggleSimulation}
              className={`p-1.5 rounded transition-colors cursor-pointer border ${
                isSimulating
                  ? 'bg-[#1a1a1a] text-neutral-300 border-[#2b2b2b] hover:text-white'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800/60'
              }`}
              title={isSimulating ? 'Pause physics simulation' : 'Resume simulation'}
            >
              {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Fit to screen */}
            <button
              type="button"
              id="graph-btn-fit"
              onClick={handleFitToScreen}
              className="p-1.5 bg-[#1a1a1a] text-neutral-300 hover:text-white rounded border border-[#2b2b2b] hover:bg-[#252525] transition-colors cursor-pointer"
              title="Fit Graph to Screen"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Zoom In */}
            <button
              type="button"
              id="graph-btn-zoomin"
              onClick={handleZoomIn}
              className="p-1.5 bg-[#1a1a1a] text-neutral-300 hover:text-white rounded border border-[#2b2b2b] hover:bg-[#252525] transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>

            {/* Zoom Out */}
            <button
              type="button"
              id="graph-btn-zoomout"
              onClick={handleZoomOut}
              className="p-1.5 bg-[#1a1a1a] text-neutral-300 hover:text-white rounded border border-[#2b2b2b] hover:bg-[#252525] transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            {/* Reset */}
            <button
              type="button"
              id="graph-btn-reset"
              onClick={handleResetZoom}
              className="p-1.5 bg-[#1a1a1a] text-neutral-300 hover:text-white rounded border border-[#2b2b2b] hover:bg-[#252525] transition-colors cursor-pointer"
              title="Reset View Position"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Export SVG */}
            <button
              type="button"
              id="graph-btn-export"
              onClick={handleExportSvg}
              className="p-1.5 bg-[#1a1a1a] text-neutral-300 hover:text-white rounded border border-[#2b2b2b] hover:bg-[#252525] transition-colors cursor-pointer"
              title="Download Graph as SVG Vector"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              id="graph-btn-fullscreen"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 bg-[#1a1a1a] text-neutral-300 hover:text-white rounded border border-[#2b2b2b] hover:bg-[#252525] transition-colors cursor-pointer"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Canvas'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Main Graph Canvas & Interactive Area
          ========================================================================= */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex">
        
        {/* SVG Drawing Surface */}
        <svg
          id="relationship-graph-svg"
          ref={svgRef}
          className="w-full h-full cursor-grab active:cursor-grabbing bg-[#0d0d0d]"
        />

        {/* Floating Legend Overlay */}
        <div className="absolute bottom-4 left-4 z-10 bg-[#121212]/90 backdrop-blur-md p-3 rounded-lg border border-[#262626] shadow-xl text-xs text-neutral-300 flex flex-col gap-2 max-w-xs pointer-events-none sm:pointer-events-auto">
          <div className="font-bold text-[11px] uppercase tracking-wider text-neutral-400 flex items-center justify-between">
            <span>Visual Legend</span>
            <span className="text-[10px] text-neutral-500 font-normal">Interactive</span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-400/40" />
              <span>User Node</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-2.5 rounded bg-[#1e293b] border border-blue-400" />
              <span>Task Card</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-2 rounded-full bg-purple-900 border border-purple-400" />
              <span>Tag Pill</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-blue-500 inline-block" />
              <span>Assignment</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-emerald-400 border-b border-dashed border-emerald-400 inline-block" />
              <span>Collaboration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-0.5 bg-purple-400 border-b border-dotted border-purple-400 inline-block" />
              <span>Tag Link</span>
            </div>
          </div>
          <div className="text-[10px] text-neutral-500 pt-1 border-t border-[#262626]">
            Drag nodes to rearrange • Double-click node to unpin • Click to inspect
          </div>
        </div>

        {/* =========================================================================
            Right Node Inspector Panel
            ========================================================================= */}
        {inspectedNode && (
          <aside
            id="graph-inspector-panel"
            className="absolute top-0 right-0 bottom-0 z-20 w-80 sm:w-96 bg-[#141414] border-l border-[#262626] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200"
          >
            {/* Panel Header */}
            <div className="p-4 border-b border-[#262626] bg-[#1a1a1a] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    inspectedNode.type === 'user'
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                      : inspectedNode.type === 'task'
                      ? 'bg-sky-600/20 text-sky-300 border border-sky-500/30'
                      : 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  }`}
                >
                  {inspectedNode.type} Details
                </span>
              </div>

              <button
                type="button"
                id="btn-close-inspector"
                onClick={() => setInspectedNode(null)}
                className="p-1 text-neutral-400 hover:text-white rounded hover:bg-[#262626] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Panel Body */}
            <div className="flex-1 p-5 overflow-y-auto space-y-5 text-neutral-200">
              
              {/* USER INSPECTION */}
              {inspectedNode.type === 'user' && inspectedNode.data?.user && (
                <div className="space-y-4">
                  {/* User Profile Header */}
                  <div className="flex items-center gap-3">
                    <img
                      src={inspectedNode.data.user.avatar}
                      alt={inspectedNode.data.user.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-blue-500 shadow-lg"
                    />
                    <div>
                      <h3 className="font-bold text-base text-white">
                        {inspectedNode.data.user.name}
                      </h3>
                      <p className="text-xs text-neutral-400">
                        {inspectedNode.data.user.title || inspectedNode.data.user.department}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                            inspectedNode.data.user.role === 'admin'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {inspectedNode.data.user.role}
                        </span>
                        <span className="text-[10px] text-neutral-500">
                          {inspectedNode.data.user.department}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Switch to this user quick button */}
                  {currentUser?.id !== inspectedNode.data.user.id && (
                    <button
                      type="button"
                      onClick={() => switchUser(inspectedNode.data.user.id)}
                      className="w-full py-2 bg-[#222222] hover:bg-blue-600 text-neutral-200 hover:text-white rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-[#333333] cursor-pointer"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Switch Session to {inspectedNode.data.user.name}
                    </button>
                  )}

                  {/* User Tasks List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-400">
                      <span>Assigned Tasks ({inspectedNode.data.assignedCount})</span>
                    </div>

                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {tasks
                        .filter((t) => t.assigneeIds.includes(inspectedNode.data.user.id))
                        .map((task) => {
                          const status = statusMap.get(task.statusId);
                          return (
                            <div
                              key={task.id}
                              className="p-2.5 bg-[#1a1a1a] border border-[#2b2b2b] rounded-lg hover:border-blue-500/60 transition-colors flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white truncate">
                                  {task.title}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-neutral-400 mt-0.5">
                                  <span className="px-1.5 py-0.2 rounded bg-[#262626] text-neutral-300">
                                    {status?.name || 'In Progress'}
                                  </span>
                                  <span>{task.priority}</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => setSelectedTaskId(task.id)}
                                className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 rounded transition-colors cursor-pointer shrink-0"
                                title="Open Task Details"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Connected Tags */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                      Associated Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from(
                        new Set(
                          tasks
                            .filter((t) =>
                              t.assigneeIds.includes(inspectedNode.data.user.id)
                            )
                            .flatMap((t) => t.tags || [])
                        )
                      ).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 bg-purple-950/40 text-purple-300 border border-purple-800/50 rounded-full text-[11px] font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TASK INSPECTION */}
              {inspectedNode.type === 'task' && inspectedNode.data?.task && (
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      Task Node
                    </span>
                    <h3 className="font-bold text-base text-white mt-0.5">
                      {inspectedNode.data.task.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 line-clamp-3">
                      {inspectedNode.data.task.description || 'No description provided.'}
                    </p>
                  </div>

                  {/* Open Task Details Button */}
                  <button
                    type="button"
                    onClick={() => setSelectedTaskId(inspectedNode.data.task.id)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/30"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Full Task Workspace
                  </button>

                  {/* Status & Priority */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-[#1a1a1a] rounded border border-[#2b2b2b]">
                      <span className="text-[10px] text-neutral-500 block">Status</span>
                      <span className="font-semibold text-white">
                        {inspectedNode.data.status?.name || 'In Progress'}
                      </span>
                    </div>

                    <div className="p-2 bg-[#1a1a1a] rounded border border-[#2b2b2b]">
                      <span className="text-[10px] text-neutral-500 block">Priority</span>
                      <span className="font-semibold text-white capitalize">
                        {inspectedNode.data.task.priority}
                      </span>
                    </div>
                  </div>

                  {/* Assignees */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                      Assignees ({inspectedNode.data.task.assigneeIds.length})
                    </span>
                    <div className="space-y-1.5">
                      {inspectedNode.data.task.assigneeIds.map((uid: string) => {
                        const user = userMap.get(uid);
                        if (!user) return null;
                        return (
                          <div
                            key={uid}
                            onClick={() => handleUserSelect(uid)}
                            className="p-2 bg-[#1a1a1a] rounded border border-[#2b2b2b] hover:border-blue-500/60 cursor-pointer flex items-center gap-2 text-xs transition-colors"
                          >
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="font-semibold text-white flex-1 truncate">
                              {user.name}
                            </span>
                            <span className="text-[10px] text-blue-400">Focus User</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tags */}
                  {inspectedNode.data.task.tags?.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                        Tags
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {inspectedNode.data.task.tags.map((t: string) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 bg-purple-950/40 text-purple-300 border border-purple-800/50 rounded-full text-[11px]"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAG INSPECTION */}
              {inspectedNode.type === 'tag' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300">
                      <Tag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white">
                        {inspectedNode.label}
                      </h3>
                      <p className="text-xs text-neutral-400">
                        {inspectedNode.data?.count} Connected Tasks
                      </p>
                    </div>
                  </div>

                  {/* Tasks with this tag */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">
                      Tasks with this Tag
                    </span>
                    <div className="space-y-1.5 max-h-72 overflow-y-auto">
                      {tasks
                        .filter((t) =>
                          t.tags?.some(
                            (tag) =>
                              `#${tag.trim().toLowerCase()}` ===
                              inspectedNode.label.toLowerCase()
                          )
                        )
                        .map((task) => (
                          <div
                            key={task.id}
                            className="p-2.5 bg-[#1a1a1a] border border-[#2b2b2b] rounded-lg hover:border-purple-500/60 transition-colors flex items-center justify-between gap-2 text-xs"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-white truncate">
                                {task.title}
                              </p>
                              <span className="text-[10px] text-neutral-400">
                                {statusMap.get(task.statusId)?.name}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => setSelectedTaskId(task.id)}
                              className="p-1 text-purple-400 hover:text-purple-300 hover:bg-purple-600/20 rounded transition-colors cursor-pointer shrink-0"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
