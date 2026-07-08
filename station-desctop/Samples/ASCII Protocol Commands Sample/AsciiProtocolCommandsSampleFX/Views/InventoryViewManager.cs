//-----------------------------------------------------------------------
// <copyright file="InventoryViewManager.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2010 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Views
{
    using System;
    using System.Collections.Generic;
    using System.Drawing;
    using System.Globalization;
    using System.Text;    
    using System.Windows.Forms;

    using Entities;

    /// <summary>
    /// Renders inventory data to a treeview
    /// </summary>
    public class InventoryViewManager
    {
        /// <summary>
        /// The target control
        /// </summary>
        private TreeView view;

        /// <summary>
        /// Identifies display items by identifier
        /// </summary>
        private Dictionary<string, TreeNode> keys;

        /// <summary>
        /// Used to render RSSI
        /// </summary>
        private RenderRssi rssi;

        /// <summary>
        /// True to display RSSI
        /// </summary>
        private bool showRssi;

        /// <summary>
        /// Initializes a new instance of the InventoryViewManager class
        /// </summary>
        /// <param name="view">The TreeView to render to</param>
        public InventoryViewManager(TreeView view)
        {
            this.view = view;
            this.keys = new Dictionary<string, TreeNode>();
            this.rssi = new RenderRssi();
        }

        /////// <summary>
        /////// Gets or sets a value indicating whether RSSI is displayed
        /////// </summary>
        ////public bool IsShowRssiEnabled
        ////{
        ////    get
        ////    {
        ////        return this.showRssi;
        ////    }

        ////    set
        ////    {
        ////        this.showRssi = value;
        ////    }
        ////}

        /// <summary>
        /// Returns the identifier of the selected transponder (if selected)
        /// </summary>
        /// <returns>The selected transponder identifier or string.Empty if none selected</returns>
        public string GetSelectedTransponder()
        {
            TreeNode node;

            node = this.view.SelectedNode;
            if (node == null)
            {
                return string.Empty;
            }
            else if (node.Tag == null)
            {
                return string.Empty;
            }
            else
            {
                return node.Tag.ToString();
            }
        }

        public void UpdateView(IEnumerable<InventoryItem> changes, bool reset)
        {
            TreeNode node;
            int timestamp;
            int age;

            if (reset)
            {
                this.view.Nodes.Clear();
                this.keys = new Dictionary<string, TreeNode>();
            }

            timestamp = Environment.TickCount;

            foreach (InventoryItem change in changes)
            {
                age = timestamp - change.LastSeenTickCount;
                this.rssi.Value = change.LastRssi;

                if (age < 5000)
                {
                    switch (change.State)
                    {
                        case RecordState.Unchanged:
                            ////if (this.IsShowRssiEnabled)
                            ////{
                            ////    if (age > 3000)
                            ////    {
                            ////        node = GetNode(change.Identifier);
                            ////        node.BackColor = SystemColors.Window;
                            ////    }
                            ////}                            

                            break;

                        case RecordState.Changed:
                            // Add seens?
                            node = this.GetNode(change.Identifier);
                            if (node == null)
                            {
                                node = this.AddNode(this.GetNodeText(change), change.Identifier);
                            }
                            else
                            {
                                node.Text = GetNodeText(change);
                            }

                            ////if (this.IsShowRssiEnabled)
                            ////{
                            ////    node.BackColor = TechnologySolutions.Drawing.ColorHelper.Lighter(SystemColors.Highlight, 1.0f - this.rssi.Fraction);
                            ////}
                            break;

                        case RecordState.Created:
                            // Create 
                            node = this.AddNode(this.GetNodeText(change), change.Identifier);
                            ////if (this.IsShowRssiEnabled)
                            ////{
                            ////    node.BackColor = TechnologySolutions.Drawing.ColorHelper.Lighter(SystemColors.Highlight, 1.0f - this.rssi.Fraction);
                            ////}
                            break;
                    }
                }
            }
        }

        /// <summary>
        /// Adds a new entry
        /// </summary>
        /// <param name="text">The text for the node</param>
        /// <param name="key">THe ket for the node</param>
        /// <returns></returns>
        private TreeNode AddNode(string text, string key)
        {
            TreeNode newNode;

            newNode = this.view.Nodes.Add(text);
            newNode.Tag = key;
            this.keys.Add(key, newNode);
            return newNode;
        }

        /// <summary>
        /// Returns the node with the specified key
        /// </summary>
        /// <param name="key">The key that identifies the node</param>
        /// <returns>The node with the specified key or null if the node is not found</returns>
        private TreeNode GetNode(string key)
        {
            if (this.keys.ContainsKey(key))
            {
                return this.keys[key];
            }
            else
            {
                return null;
            }
        }       

        /// <summary>
        /// Returns the text for the specified item
        /// </summary>
        /// <param name="change">The item to get the text for</param>
        /// <returns>The text</returns>
        private string GetNodeText(InventoryItem change)
        {
            ////if (this.IsShowRssiEnabled)
            ////{
            ////    return string.Format(CultureInfo.CurrentUICulture, "{0} - {1}", change.Identifier, change.LastRssi);
            ////}
            ////else
            {
                return string.Format(CultureInfo.CurrentUICulture, "{0} - {1}", change.Identifier, change.Count);
            }
        }
    }    
}
