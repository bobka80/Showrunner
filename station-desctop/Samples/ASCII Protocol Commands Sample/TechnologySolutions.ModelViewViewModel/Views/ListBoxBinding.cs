//-----------------------------------------------------------------------
// <copyright file="ListBoxBinding.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel.Views
{
    using System;
    using System.ComponentModel;
    using System.Linq;
    using System.Text;
    using System.Windows.Forms;

    /// <summary>
    /// Binds an ObservableCollection to a list
    /// </summary>
    public class ListBoxBinding
        : ListBinding
    {
        /// <summary>
        /// Initializes a new instance of the ListBoxBinding class
        /// </summary>
        /// <param name="target">The target to update</param>
        /// <param name="source">The source list</param>
        public ListBoxBinding(ListBox target, object source)
            : base(target, target.Items, source)
        {
        }

        /// <summary>
        /// Gets or sets a value indicating whether to select a new item as it is added to the list
        /// </summary>
        public bool SelectNewest { get; set; }

        /// <summary>
        /// Add the item to the list
        /// </summary>
        /// <param name="value">The item to add</param>
        /// <param name="index">The index to add to</param>
        protected override void OnAddedItem(object value, int index)
        {
            if (this.SelectNewest)
            {
                ListBox listBox = this.Target as ListBox;

                listBox.ClearSelected();
                listBox.SelectedIndex = index;
            }
        }
    }
}
