//-----------------------------------------------------------------------
// <copyright file="ListBinding.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2014 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.ModelViewViewModel.Views
{
    using System;
    using System.Collections;
    using System.Collections.Specialized;
    using System.ComponentModel;
    using System.Linq;
    using System.Text;
    using System.Windows.Forms;

    /// <summary>
    /// Binds an ObservableCollection to a list
    /// </summary>
    public class ListBinding
    {
        /// <summary>
        /// Initializes a new instance of the ListBinding class
        /// </summary>
        /// <param name="target">Optional. The Control that owns the list (calls SuspendLayout() ResumeLayout() as the list changes</param>
        /// <param name="targetList">The list to update when the source changes</param>
        /// <param name="source">The list to observe</param>
        public ListBinding(Control target, IList targetList, object source)
        {
            if (source == null)
            {
                throw new ArgumentNullException("source");
            }

            if (targetList == null)
            {
                throw new ArgumentNullException("targetList");
            }            

            this.Target = target;
            this.TargetList = targetList;

            try
            {
                (source as INotifyCollectionChanged).CollectionChanged += this.Source_CollectionChanged;
            }
            catch (NullReferenceException nre)
            {
                throw new ArgumentException("source must implement INotifyCollectionChanged", nre);
            }

            try
            {
                this.Add(source as System.Collections.IList, 0);
            }
            catch (NullReferenceException nre)
            {
                throw new ArgumentException("source must implement System.Collections.IList", nre);
            }
        }

        /// <summary>
        /// Gets he target control that owns the list. Optional
        /// </summary>
        /// <remarks>
        /// If not null the control SuspendLayout() is called before a list change and
        /// ResumeLayout() after a list change
        /// </remarks>
        protected Control Target { get; private set; }

        /// <summary>
        /// Gets the target list that the collection is bound to
        /// </summary>
        protected IList TargetList { get; private set; }        

        /// <summary>
        /// Called before the list is changed. By default if target is not null calls target.SuspendLayout()
        /// </summary>
        protected virtual void OnCollectionChanging()
        {
            if (this.Target != null)
            {
                this.Target.SuspendLayout();
            }
        }

        /// <summary>
        /// Called after the list is changed. By default if target is not null calls target.ResumeLayout()
        /// </summary>
        protected virtual void OnCollectionChanged()
        {
            if (this.Target != null)
            {
                this.Target.ResumeLayout();
            }
        }

        /// <summary>
        /// Called when an item is added to the source list. Override to convert the added item from the source to the target list type
        /// </summary>
        /// <param name="item">
        /// The item to be added to the list. When passed in this is the item from the observed list. Set this to a instance 
        /// of the matching item in the bound list
        /// </param>
        protected virtual void OnAddingItem(ref object item)
        {            
        }

        /// <summary>
        /// Called after an item is added to the target list
        /// </summary>
        /// <param name="item">The object added to the target list</param>
        /// <param name="index">The index at which the item was added</param>
        /// <remarks>
        /// item is the object added to the target list which may be different to the item added to the source list
        /// </remarks>
        protected virtual void OnAddedItem(object item, int index)
        {
        }

        /// <summary>
        /// Called after an item is removed from the target list
        /// </summary>
        /// <param name="item">The object removed from the target list</param>
        /// <param name="index">The index at which the item was removed</param>
        protected virtual void OnRemovedItem(object item, int index)
        {
        }

        /// <summary>
        /// Handles changes to the collection
        /// </summary>
        /// <param name="sender">The event source</param>
        /// <param name="e">The data provided for the event</param>
        private void Source_CollectionChanged(object sender, NotifyCollectionChangedEventArgs e)
        {
            this.OnCollectionChanging();

            switch (e.Action)
            {
                case NotifyCollectionChangedAction.Add:
                    this.Add(e.NewItems, e.NewStartingIndex);
                    break;

                case NotifyCollectionChangedAction.Move:
                    this.Remove(e.OldItems, e.OldStartingIndex);
                    this.Add(e.NewItems, e.NewStartingIndex);
                    break;

                case NotifyCollectionChangedAction.Remove:
                    this.Remove(e.OldItems, e.OldStartingIndex);
                    break;

                case NotifyCollectionChangedAction.Replace:
                    this.Remove(e.OldItems, e.OldStartingIndex);
                    this.Add(e.NewItems, e.NewStartingIndex);
                    break;

                case NotifyCollectionChangedAction.Reset:
                    this.TargetList.Clear();
                    this.Add(e.NewItems, e.NewStartingIndex);
                    break;
            }

            this.OnCollectionChanged();
        }

        /// <summary>
        /// Add the items to the list
        /// </summary>
        /// <param name="values">The items to add</param>
        /// <param name="startingIndex">The first index to add to</param>
        private void Add(System.Collections.IList values, int startingIndex)
        {
            if (values != null)
            {
                foreach (object value in values)
                {
                    this.Add(value, startingIndex++);
                }
            }
        }

        /// <summary>
        /// Add the item to the list
        /// </summary>
        /// <param name="value">The item to ass</param>
        /// <param name="index">The index to add to</param>
        private void Add(object value, int index)
        {
            this.OnAddingItem(ref value);
            this.TargetList.Insert(index, value);
            this.OnAddedItem(value, index);
        }

        /// <summary>
        /// Remove the items from the list
        /// </summary>
        /// <param name="values">The items to remove</param>
        /// <param name="startingIndex">The first index to remove from</param>
        private void Remove(System.Collections.IList values, int startingIndex)
        {
            if (values != null)
            {
                foreach (object value in values)
                {
                    this.Remove(value, startingIndex++);
                }
            }
        }        

        /// <summary>
        /// Remove the item from the list
        /// </summary>
        /// <param name="value">The item to remove</param>
        /// <param name="index">The index to remove from</param>
        private void Remove(object value, int index)
        {            
            this.TargetList.RemoveAt(index);
            this.OnRemovedItem(value, index);
        }        
    }
}
